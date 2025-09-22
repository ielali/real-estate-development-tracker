import { describe, it, expect, beforeEach } from "vitest"
import {
  db,
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
} from "../db"
import {
  formatAddress,
  getCategoriesByType,
  isValidCategoryForType,
  type Address,
} from "../db/types"
import { sql } from "drizzle-orm"
import { eq } from "drizzle-orm"

describe("Database Operations", () => {
  beforeEach(async () => {
    await db.delete(auditLog)
    await db.delete(projectContact)
    await db.delete(projectAccess)
    await db.delete(events)
    await db.delete(documents)
    await db.delete(costs)
    await db.delete(contacts)
    await db.delete(projects)
    await db.delete(users)
  })

  describe("Database Connection", () => {
    it("should establish database connection", async () => {
      const result = await db.run(sql`SELECT 1 as test`)
      expect(result).toBeDefined()
    })

    it("should have foreign keys enabled", async () => {
      const result = await db.get<{ foreign_keys: number }>(sql`PRAGMA foreign_keys`)
      expect(result?.foreign_keys).toBe(1)
    })
  })

  describe("User CRUD Operations", () => {
    it("should create a user", async () => {
      const user = await db
        .insert(users)
        .values({
          email: "test@example.com",
          password: "temp_password",
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
          email: "update@example.com",
          password: "temp_password",
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
        email: "duplicate@example.com",
        password: "temp_password",
        firstName: "First",
        lastName: "User",
      })

      await expect(
        db.insert(users).values({
          email: "duplicate@example.com",
          password: "temp_password",
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
          email: "owner@example.com",
          password: "temp_password",
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
      testUser = await db
        .insert(users)
        .values({
          email: "cost-user@example.com",
          password: "temp_password",
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
          categoryId: "labor",
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
          email: "soft-delete@example.com",
          password: "temp_password",
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
      expect(isValidCategoryForType("materials", "cost")).toBe(true)
      expect(isValidCategoryForType("labor", "cost")).toBe(true)
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

  describe("Seed Script Validation", () => {
    it("should verify seed creates expected data structure", async () => {
      const { migrate } = await import("drizzle-orm/better-sqlite3/migrator")
      const Database = (await import("better-sqlite3")).default
      const { drizzle } = await import("drizzle-orm/better-sqlite3")
      const { execSync } = await import("child_process")
      const path = await import("path")

      // Create a fresh database for this test
      const testDb = new Database("./seed-test.db")
      const testDbInstance = drizzle(testDb)

      // Run migration on test database
      migrate(testDbInstance, {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      })

      testDb.close()

      // Run seed script
      execSync("npx tsx src/server/db/seed.ts", {
        env: { ...process.env, DATABASE_URL: "file:./seed-test.db" },
      })

      // Reconnect and check counts
      const checkDb = new Database("./seed-test.db")
      const checkDbInstance = drizzle(checkDb, {
        schema: await import("../db/schema"),
      })

      const userCount = await checkDbInstance
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .then((rows) => rows[0].count)

      const projectCount = await checkDbInstance
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .then((rows) => rows[0].count)

      const costCount = await checkDbInstance
        .select({ count: sql<number>`count(*)` })
        .from(costs)
        .then((rows) => rows[0].count)

      checkDb.close()

      // Clean up
      const fs = await import("fs")
      if (fs.existsSync("./seed-test.db")) {
        fs.unlinkSync("./seed-test.db")
      }

      expect(userCount).toBe(3)
      expect(projectCount).toBe(3)
      expect(costCount).toBe(20)
    })
  })
})
