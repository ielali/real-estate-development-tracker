import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest"
import { sql } from "drizzle-orm"
import { appRouter } from "../api/root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "../db/schema/users"
import { users } from "../db/schema/users"
import { projects } from "../db/schema/projects"
import { addresses } from "../db/schema/addresses"
import { categories } from "../db/schema/categories"
import { CATEGORIES } from "../db/types"

/**
 * Cost Router Tests
 *
 * Tests all CRUD operations for costs against remote Neon PostgreSQL database.
 * IMPORTANT: Database must be empty at start - each test creates its own data and cleans up.
 *
 * Coverage:
 * - Creating costs with valid data
 * - Listing project costs with filtering
 * - Getting cost by ID
 * - Updating costs
 * - Soft deleting costs
 * - Running total calculation
 * - Access control (users can only access costs from their own projects)
 * - Validation (negative amounts, invalid category, future date)
 */
describe("Cost Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let anotherUser: User
  let testProjectId: string
  let anotherUserProjectId: string

  const createMockSession = (userId: string) => ({
    id: `session-${userId}`,
    userId,
    expiresAt: new Date(Date.now() + 86400000),
    token: `token-${userId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: "127.0.0.1",
    userAgent: "test",
  })

  const createMockContext = (user: User) => ({
    headers: new Headers(),
    db: testDbInstance.db,
    session: {
      session: createMockSession(user.id),
      user,
    },
    user,
  })

  beforeAll(async () => {
    testDbInstance = await createTestDb()
    // Categories are seeded globally in test/setup.ts
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    // Clean up before each test - ensure remote DB is empty for test isolation
    // NOTE: Categories table is NOT truncated because they're static reference data
    await testDbInstance.cleanup()

    // Seed categories (static reference data - use idempotent check)
    const existingCategories = await testDbInstance.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
    if (Number(existingCategories[0]?.count) === 0) {
      await testDbInstance.db.insert(categories).values(CATEGORIES)
    }

    // Create test users with unique IDs to avoid conflicts
    const user1 = await testDbInstance.db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: `testuser-${Date.now()}-${Math.random()}@example.com`,
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()
      .then((rows: any[]) => rows[0])

    const user2 = await testDbInstance.db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: `anotheruser-${Date.now()}-${Math.random()}@example.com`,
        name: "Another User",
        firstName: "Another",
        lastName: "User",
      })
      .returning()
      .then((rows: any[]) => rows[0])

    testUser = user1
    anotherUser = user2

    // Create test addresses
    const address1 = await testDbInstance.db
      .insert(addresses)
      .values({
        streetNumber: "123",
        streetName: "Test",
        streetType: "Street",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        formattedAddress: "123 Test Street, Sydney NSW 2000",
      })
      .returning()
      .then((rows: any[]) => rows[0])

    const address2 = await testDbInstance.db
      .insert(addresses)
      .values({
        streetNumber: "456",
        streetName: "Another",
        streetType: "Road",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
        formattedAddress: "456 Another Road, Melbourne VIC 3000",
      })
      .returning()
      .then((rows: any[]) => rows[0])

    // Create test projects
    const project1 = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Test Project",
        addressId: address1.id,
        projectType: "renovation",
        status: "active",
        ownerId: testUser.id,
        startDate: new Date("2024-01-01"),
      })
      .returning()
      .then((rows: any[]) => rows[0])

    const project2 = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Another Project",
        addressId: address2.id,
        projectType: "new_build",
        status: "planning",
        ownerId: anotherUser.id,
        startDate: new Date("2024-01-01"),
      })
      .returning()
      .then((rows: any[]) => rows[0])

    testProjectId = project1.id
    anotherUserProjectId = project2.id
  })

  describe("create", () => {
    it("creates cost with valid input", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const result = await caller.costs.create({
        projectId: testProjectId,
        amount: 15000, // $150.00 in cents
        description: "Building materials",
        categoryId: "cost_materials",
        date: new Date("2024-03-01"),
      })

      expect(result).toMatchObject({
        amount: 15000,
        description: "Building materials",
        categoryId: "cost_materials",
        projectId: testProjectId,
        createdById: testUser.id,
      })
      expect(result.id).toBeDefined()
      expect(result.deletedAt).toBeNull()
    })

    it("rejects negative amount", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.costs.create({
          projectId: testProjectId,
          amount: -100,
          description: "Invalid cost",
          categoryId: "cost_materials",
          date: new Date("2024-03-01"),
        })
      ).rejects.toThrow()
    })

    it("rejects future date", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7) // 7 days in the future

      await expect(
        caller.costs.create({
          projectId: testProjectId,
          amount: 10000,
          description: "Future cost",
          categoryId: "cost_materials",
          date: futureDate,
        })
      ).rejects.toThrow()
    })

    it("rejects invalid category", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.costs.create({
          projectId: testProjectId,
          amount: 10000,
          description: "Invalid category cost",
          categoryId: "invalid_category",
          date: new Date("2024-03-01"),
        })
      ).rejects.toThrow()
    })

    it("rejects cost creation for project user doesn't own", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.costs.create({
          projectId: anotherUserProjectId,
          amount: 10000,
          description: "Unauthorized cost",
          categoryId: "cost_materials",
          date: new Date("2024-03-01"),
        })
      ).rejects.toThrow()
    })

    it("requires description", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.costs.create({
          projectId: testProjectId,
          amount: 10000,
          description: "",
          categoryId: "cost_materials",
          date: new Date("2024-03-01"),
        })
      ).rejects.toThrow()
    })
  })

  describe("list", () => {
    beforeEach(async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      // Create multiple costs
      await caller.costs.create({
        projectId: testProjectId,
        amount: 10000,
        description: "Materials cost 1",
        categoryId: "cost_materials",
        date: new Date("2024-01-15"),
      })

      await caller.costs.create({
        projectId: testProjectId,
        amount: 20000,
        description: "Labor cost 1",
        categoryId: "cost_labor",
        date: new Date("2024-02-01"),
      })

      await caller.costs.create({
        projectId: testProjectId,
        amount: 5000,
        description: "Permits",
        categoryId: "cost_permits_fees",
        date: new Date("2024-03-15"),
      })
    })

    it("lists all costs for a project", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const costs = await caller.costs.list({ projectId: testProjectId })

      expect(costs).toHaveLength(3)
      expect(costs[0].projectId).toBe(testProjectId)
      expect(costs[0].category).toBeDefined()
    })

    it("filters costs by category", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const costs = await caller.costs.list({
        projectId: testProjectId,
        categoryId: "cost_materials",
      })

      expect(costs).toHaveLength(1)
      expect(costs[0].categoryId).toBe("cost_materials")
    })

    it("filters costs by date range", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const costs = await caller.costs.list({
        projectId: testProjectId,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-03-31"),
      })

      expect(costs).toHaveLength(2) // Labor and Permits
    })

    it("rejects listing costs for project user doesn't own", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(caller.costs.list({ projectId: anotherUserProjectId })).rejects.toThrow()
    })
  })

  describe("getById", () => {
    let costId: string

    beforeEach(async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const cost = await caller.costs.create({
        projectId: testProjectId,
        amount: 15000,
        description: "Test cost",
        categoryId: "cost_materials",
        date: new Date("2024-03-01"),
      })

      costId = cost.id
    })

    it("gets cost by ID", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const cost = await caller.costs.getById({ id: costId })

      expect(cost.id).toBe(costId)
      expect(cost.description).toBe("Test cost")
      expect(cost.category).toBeDefined()
      expect(cost.category?.displayName).toBe("Construction Materials")
    })

    it("rejects getting cost from another user's project", async () => {
      const ctx = createMockContext(anotherUser)
      const caller = appRouter.createCaller(ctx)

      await expect(caller.costs.getById({ id: costId })).rejects.toThrow()
    })
  })

  describe("update", () => {
    let costId: string

    beforeEach(async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const cost = await caller.costs.create({
        projectId: testProjectId,
        amount: 15000,
        description: "Original description",
        categoryId: "cost_materials",
        date: new Date("2024-03-01"),
      })

      costId = cost.id
    })

    it("updates cost with valid data", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const updated = await caller.costs.update({
        id: costId,
        amount: 25000,
        description: "Updated description",
      })

      expect(updated.amount).toBe(25000)
      expect(updated.description).toBe("Updated description")
      expect(updated.categoryId).toBe("cost_materials") // Unchanged
    })

    it("updates only specified fields", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const updated = await caller.costs.update({
        id: costId,
        description: "Only description changed",
      })

      expect(updated.description).toBe("Only description changed")
      expect(updated.amount).toBe(15000) // Unchanged
    })

    it("rejects updating cost from another user's project", async () => {
      const ctx = createMockContext(anotherUser)
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.costs.update({
          id: costId,
          description: "Unauthorized update",
        })
      ).rejects.toThrow()
    })
  })

  describe("softDelete", () => {
    let costId: string

    beforeEach(async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const cost = await caller.costs.create({
        projectId: testProjectId,
        amount: 15000,
        description: "To be deleted",
        categoryId: "cost_materials",
        date: new Date("2024-03-01"),
      })

      costId = cost.id
    })

    it("soft deletes cost", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const result = await caller.costs.softDelete({ id: costId })

      expect(result.success).toBe(true)

      // Verify cost no longer appears in list
      const costs = await caller.costs.list({ projectId: testProjectId })
      expect(costs).toHaveLength(0)
    })

    it("rejects deleting cost from another user's project", async () => {
      const ctx = createMockContext(anotherUser)
      const caller = appRouter.createCaller(ctx)

      await expect(caller.costs.softDelete({ id: costId })).rejects.toThrow()
    })
  })

  describe("getTotal", () => {
    beforeEach(async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      // Create multiple costs
      await caller.costs.create({
        projectId: testProjectId,
        amount: 10000,
        description: "Cost 1",
        categoryId: "cost_materials",
        date: new Date("2024-01-15"),
      })

      await caller.costs.create({
        projectId: testProjectId,
        amount: 20000,
        description: "Cost 2",
        categoryId: "cost_labor",
        date: new Date("2024-02-01"),
      })

      await caller.costs.create({
        projectId: testProjectId,
        amount: 5000,
        description: "Cost 3",
        categoryId: "cost_permits_fees",
        date: new Date("2024-03-15"),
      })
    })

    it("calculates running total correctly", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const result = await caller.costs.getTotal({ projectId: testProjectId })

      expect(result.total).toBe(35000) // 10000 + 20000 + 5000
    })

    it("calculates total with category filter", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const result = await caller.costs.getTotal({
        projectId: testProjectId,
        categoryId: "cost_materials",
      })

      expect(result.total).toBe(10000)
    })

    it("calculates total with date range filter", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      const result = await caller.costs.getTotal({
        projectId: testProjectId,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-03-31"),
      })

      expect(result.total).toBe(25000) // 20000 + 5000
    })

    it("excludes soft-deleted costs from total", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      // Get all costs and delete the oldest one (10000)
      // Costs are sorted by date desc by default:
      // costs[0] = 5000 (newest, 2024-03-15)
      // costs[1] = 20000 (middle, 2024-02-01)
      // costs[2] = 10000 (oldest, 2024-01-15)
      const costs = await caller.costs.list({ projectId: testProjectId })
      await caller.costs.softDelete({ id: costs[2].id })

      const result = await caller.costs.getTotal({ projectId: testProjectId })

      expect(result.total).toBe(25000) // 35000 - 10000
    })

    it("rejects getting total for project user doesn't own", async () => {
      const ctx = createMockContext(testUser)
      const caller = appRouter.createCaller(ctx)

      await expect(caller.costs.getTotal({ projectId: anotherUserProjectId })).rejects.toThrow()
    })
  })
})
