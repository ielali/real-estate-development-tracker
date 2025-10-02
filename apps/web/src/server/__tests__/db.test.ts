import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest"
import { createTestDb } from "@/test/test-db"
import {
  users,
  addresses,
  projects,
  costs,
  contacts,
  documents,
  events,
  projectAccess,
  projectContact,
  auditLog,
  categories,
} from "../db/schema"
import {
  formatAddress,
  getCategoriesByType,
  isValidCategoryForType,
  type Address,
} from "../db/types"
import { sql } from "drizzle-orm"
import { eq } from "drizzle-orm"

describe("Database Operations", () => {
  let testDbConnection: Awaited<ReturnType<typeof createTestDb>>
  let db: Awaited<ReturnType<typeof createTestDb>>["db"]

  beforeAll(async () => {
    testDbConnection = await createTestDb()
    db = testDbConnection.db
  })

  afterAll(async () => {
    await testDbConnection.cleanup()
  })

  beforeEach(async () => {
    await db.delete(auditLog)
    await db.delete(projectContact)
    await db.delete(projectAccess)
    await db.delete(events)
    await db.delete(documents)
    await db.delete(costs)
    await db.delete(contacts)
    await db.delete(projects)
    await db.delete(addresses)
    await db.delete(categories)
    await db.delete(users)
  })

  describe("Database Connection", () => {
    it("should establish database connection", async () => {
      const result = await db.execute(sql`SELECT 1 as test`)
      expect(result).toBeDefined()
    })

    it("should have foreign keys enabled", async () => {
      // PostgreSQL has foreign keys always enabled by default
      // Test by attempting a foreign key violation
      const testUserId = crypto.randomUUID()
      await expect(
        db.insert(projects).values({
          name: "FK Test Project",
          projectType: "renovation",
          ownerId: testUserId, // Non-existent user
        })
      ).rejects.toThrow()
    })
  })

  describe("User CRUD Operations", () => {
    it("should create a user", async () => {
      const user = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "test@example.com",
          name: "Test User",
          firstName: "Test",
          lastName: "User",
          role: "partner",
        })
        .returning()
        .then((rows) => rows[0])

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toBe("test@example.com")
      expect(user.role).toBe("partner")
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it("should update a user", async () => {
      const user = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "update@example.com",
          name: "Original Name",
          firstName: "Original",
          lastName: "Name",
        })
        .returning()
        .then((rows) => rows[0])

      const updated = await db
        .update(users)
        .set({ firstName: "Updated" })
        .where(eq(users.id, user.id))
        .returning()
        .then((rows) => rows[0])

      expect(updated.firstName).toBe("Updated")
      expect(updated.lastName).toBe("Name")
    })

    it("should enforce unique email constraint", async () => {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email: "duplicate@example.com",
        name: "First User",
        firstName: "First",
        lastName: "User",
      })

      await expect(
        db.insert(users).values({
          id: crypto.randomUUID(),
          email: "duplicate@example.com",
          name: "Second User",
          firstName: "Second",
          lastName: "User",
        })
      ).rejects.toThrow()
    })
  })

  describe("Project Operations", () => {
    let testUser: typeof users.$inferSelect

    beforeEach(async () => {
      testUser = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "owner@example.com",
          name: "Project Owner",
          firstName: "Project",
          lastName: "Owner",
          role: "admin",
        })
        .returning()
        .then((rows) => rows[0])
    })

    it("should create a project with owner and proper address", async () => {
      const addressData: Address = {
        streetNumber: "123",
        streetName: "Test",
        streetType: "Street",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      }

      // First create the address
      const address = await db
        .insert(addresses)
        .values({
          streetNumber: addressData.streetNumber,
          streetName: addressData.streetName,
          streetType: addressData.streetType,
          suburb: addressData.suburb,
          state: addressData.state,
          postcode: addressData.postcode,
          country: addressData.country,
          formattedAddress: formatAddress(addressData),
        })
        .returning()
        .then((rows) => rows[0])

      // Then create the project with address reference
      const project = await db
        .insert(projects)
        .values({
          name: "Test Project",
          description: "Test Description",
          addressId: address.id,
          projectType: "renovation",
          status: "planning",
          ownerId: testUser.id,
          totalBudget: 1000000,
        })
        .returning()
        .then((rows) => rows[0])

      expect(project).toBeDefined()
      expect(project.name).toBe("Test Project")
      expect(project.ownerId).toBe(testUser.id)
      expect(project.status).toBe("planning")
      expect(project.addressId).toBe(address.id)

      // Verify the address was created correctly
      expect(address.suburb).toBe("Melbourne")
      expect(address.state).toBe("VIC")
      expect(address.formattedAddress).toBe("123 Test Street, Melbourne, VIC 3000")
    })

    it("should enforce foreign key constraint for owner", async () => {
      await expect(
        db.insert(projects).values({
          name: "Invalid Project",
          projectType: "renovation",
          ownerId: "non-existent-id",
        })
      ).rejects.toThrow()
    })
  })

  describe("Cost Operations", () => {
    let testUser: typeof users.$inferSelect
    let testProject: typeof projects.$inferSelect

    beforeEach(async () => {
      // Create required categories first
      await db.insert(categories).values([
        { id: "materials", type: "cost", displayName: "Materials", parentId: null },
        { id: "labour", type: "cost", displayName: "Labour", parentId: null },
        { id: "contractor", type: "contact", displayName: "Contractor", parentId: null },
        {
          id: "general_contractor",
          type: "contact",
          displayName: "General Contractor",
          parentId: null,
        },
      ])

      testUser = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "cost-user@example.com",
          name: "Cost Creator",
          firstName: "Cost",
          lastName: "Creator",
        })
        .returning()
        .then((rows) => rows[0])

      testProject = await db
        .insert(projects)
        .values({
          name: "Cost Test Project",
          projectType: "renovation",
          ownerId: testUser.id,
        })
        .returning()
        .then((rows) => rows[0])
    })

    it("should create a cost entry", async () => {
      const cost = await db
        .insert(costs)
        .values({
          projectId: testProject.id,
          amount: 50000,
          description: "Test materials",
          categoryId: "materials",
          date: new Date(),
          createdById: testUser.id,
        })
        .returning()
        .then((rows) => rows[0])

      expect(cost).toBeDefined()
      expect(cost.amount).toBe(50000)
      expect(cost.projectId).toBe(testProject.id)
      expect(cost.createdById).toBe(testUser.id)
    })

    it("should handle cost with contact reference", async () => {
      const contact = await db
        .insert(contacts)
        .values({
          firstName: "Test",
          lastName: "Contractor",
          categoryId: "general_contractor",
        })
        .returning()
        .then((rows) => rows[0])

      const cost = await db
        .insert(costs)
        .values({
          projectId: testProject.id,
          amount: 75000,
          description: "Contract work",
          categoryId: "labour",
          date: new Date(),
          contactId: contact.id,
          createdById: testUser.id,
        })
        .returning()
        .then((rows) => rows[0])

      expect(cost.contactId).toBe(contact.id)
    })
  })

  describe("Soft Delete Functionality", () => {
    it("should soft delete a user", async () => {
      const user = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "soft-delete@example.com",
          name: "Delete Test",
          firstName: "Delete",
          lastName: "Test",
        })
        .returning()
        .then((rows) => rows[0])

      const deletedUser = await db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning()
        .then((rows) => rows[0])

      expect(deletedUser.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe("Address and Category Validation", () => {
    beforeEach(async () => {
      // Create required categories for validation tests
      await db.insert(categories).values([
        { id: "electrician", type: "contact", displayName: "Electrician", parentId: null },
        { id: "materials-validation", type: "cost", displayName: "Materials", parentId: null },
        { id: "photos", type: "document", displayName: "Photos", parentId: null },
        { id: "inspection", type: "event", displayName: "Inspection", parentId: null },
      ])
    })

    it("should format Australian addresses correctly", () => {
      const address: Address = {
        streetNumber: "123",
        streetName: "Collins",
        streetType: "Street",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      }

      const formatted = formatAddress(address)
      expect(formatted).toBe("123 Collins Street, Melbourne, VIC 3000")
    })

    it("should handle addresses without street type", () => {
      const address: Partial<Address> = {
        streetNumber: "456",
        streetName: "Chapel",
        streetType: null,
        suburb: "South Yarra",
        state: "VIC",
        postcode: "3141",
        country: "Australia",
      }

      const formatted = formatAddress(address)
      expect(formatted).toBe("456 Chapel, South Yarra, VIC 3141")
    })

    it("should validate contact categories", () => {
      expect(isValidCategoryForType("electrician", "contact")).toBe(true)
      expect(isValidCategoryForType("plumber", "contact")).toBe(true)
      expect(isValidCategoryForType("materials", "contact")).toBe(false)
      expect(isValidCategoryForType("photos", "contact")).toBe(false)
    })

    it("should validate cost categories", () => {
      expect(isValidCategoryForType("cost_materials", "cost")).toBe(true)
      expect(isValidCategoryForType("cost_labor", "cost")).toBe(true)
      expect(isValidCategoryForType("electrician", "cost")).toBe(false)
      expect(isValidCategoryForType("photos", "cost")).toBe(false)
    })

    it("should get categories by type", () => {
      const contactCategories = getCategoriesByType("contact")
      const costCategories = getCategoriesByType("cost")
      const documentCategories = getCategoriesByType("document")
      const eventCategories = getCategoriesByType("event")

      expect(contactCategories.length).toBeGreaterThan(0)
      expect(costCategories.length).toBeGreaterThan(0)
      expect(documentCategories.length).toBeGreaterThan(0)
      expect(eventCategories.length).toBeGreaterThan(0)

      expect(contactCategories.every((cat) => cat.type === "contact")).toBe(true)
      expect(costCategories.every((cat) => cat.type === "cost")).toBe(true)
      expect(documentCategories.every((cat) => cat.type === "document")).toBe(true)
      expect(eventCategories.every((cat) => cat.type === "event")).toBe(true)
    })

    it("should validate category references in contacts", async () => {
      const validContact = await db
        .insert(contacts)
        .values({
          firstName: "Test",
          lastName: "Electrician",
          categoryId: "electrician",
        })
        .returning()
        .then((rows) => rows[0])

      expect(validContact).toBeDefined()
      expect(isValidCategoryForType(validContact.categoryId, "contact")).toBe(true)
    })
  })
})
