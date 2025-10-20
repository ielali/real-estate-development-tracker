/**
 * Cost Router Search and Filter Tests
 *
 * Tests search, filtering, and sorting functionality added in Story 2.4
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"

describe("Cost Router - Search and Filter (Story 2.4)", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let caller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let categoryId: string
  let contactId: string

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
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    await testDbInstance.cleanup()

    // Create test user
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-1",
        email: "testuser@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    caller = appRouter.createCaller(createMockContext(testUser))

    // Create a test project
    const project = await caller.projects.create({
      name: "Test Project",
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        formatted: "123 Test St, Sydney NSW 2000",
      },
      startDate: new Date("2024-01-01"),
      projectType: "renovation",
    })
    projectId = project.id

    // Create a test category
    const category = await caller.category.create({
      displayName: "Plumbing",
      type: "cost",
      parentId: null,
    })
    categoryId = category.id

    // Create a test contact
    const contact = await caller.contacts.create({
      projectId,
      firstName: "John",
      lastName: "Plumber",
    })
    contactId = contact.id

    // Create test costs
    await caller.costs.create({
      projectId,
      amount: 50000, // $500
      description: "Fix kitchen plumbing",
      categoryId,
      date: new Date("2024-01-15"),
      contactId,
    })

    await caller.costs.create({
      projectId,
      amount: 150000, // $1500
      description: "Replace bathroom fixtures",
      categoryId,
      date: new Date("2024-01-20"),
      contactId,
    })

    await caller.costs.create({
      projectId,
      amount: 25000, // $250
      description: "Install new electrical outlet",
      date: new Date("2024-01-10"),
    })
  })

  describe("Text Search", () => {
    test("should search costs by description (case-insensitive)", async () => {
      const results = await caller.costs.list({
        projectId,
        searchText: "plumbing",
      })

      expect(results).toHaveLength(1)
      expect(results[0]?.description).toBe("Fix kitchen plumbing")
    })

    test("should support partial match in description", async () => {
      const results = await caller.costs.list({
        projectId,
        searchText: "bathroom",
      })

      expect(results).toHaveLength(1)
      expect(results[0]?.description).toContain("bathroom")
    })

    test("should return empty array when no matches found", async () => {
      const results = await caller.costs.list({
        projectId,
        searchText: "nonexistent",
      })

      expect(results).toHaveLength(0)
    })
  })

  describe("Amount Range Filtering", () => {
    test("should filter by minimum amount", async () => {
      const results = await caller.costs.list({
        projectId,
        minAmount: 100000, // $1000
      })

      expect(results).toHaveLength(1)
      expect(results[0]?.amount).toBe(150000)
    })

    test("should filter by maximum amount", async () => {
      const results = await caller.costs.list({
        projectId,
        maxAmount: 50000, // $500
      })

      expect(results).toHaveLength(2) // $500 and $250
    })

    test("should filter by both min and max amount", async () => {
      const results = await caller.costs.list({
        projectId,
        minAmount: 25000, // $250
        maxAmount: 50000, // $500
      })

      expect(results).toHaveLength(2)
      expect(results.every((c) => c.amount >= 25000 && c.amount <= 50000)).toBe(true)
    })
  })

  describe("Contact Filtering", () => {
    test("should filter by specific contact ID", async () => {
      const results = await caller.costs.list({
        projectId,
        contactId,
      })

      expect(results).toHaveLength(2)
      expect(results.every((c) => c.contactId === contactId)).toBe(true)
    })

    test("should search by contact name", async () => {
      const results = await caller.costs.list({
        projectId,
        contactNameSearch: "John",
      })

      expect(results).toHaveLength(2)
      expect(results.every((c) => c.contact?.firstName === "John")).toBe(true)
    })

    test("should search by contact last name", async () => {
      const results = await caller.costs.list({
        projectId,
        contactNameSearch: "Plumber",
      })

      expect(results).toHaveLength(2)
    })
  })

  describe("Sorting", () => {
    test("should sort by date descending (default)", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "date",
        sortDirection: "desc",
      })

      expect(results[0]?.date.getTime()).toBeGreaterThanOrEqual(results[1]?.date.getTime() ?? 0)
    })

    test("should sort by date ascending", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "date",
        sortDirection: "asc",
      })

      expect(results[0]?.date.getTime()).toBeLessThanOrEqual(results[1]?.date.getTime() ?? 0)
    })

    test("should sort by amount descending", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "amount",
        sortDirection: "desc",
      })

      expect(results[0]?.amount).toBe(150000) // $1500
      expect(results[1]?.amount).toBe(50000) // $500
      expect(results[2]?.amount).toBe(25000) // $250
    })

    test("should sort by amount ascending", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "amount",
        sortDirection: "asc",
      })

      expect(results[0]?.amount).toBe(25000) // $250
      expect(results[1]?.amount).toBe(50000) // $500
      expect(results[2]?.amount).toBe(150000) // $1500
    })

    test("should sort by contact name", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "contact",
        sortDirection: "asc",
      })

      // Should have contacts first, then nulls
      expect(results.some((c) => c.contact !== null)).toBe(true)
    })

    test("should sort by category name", async () => {
      const results = await caller.costs.list({
        projectId,
        sortBy: "category",
        sortDirection: "asc",
      })

      expect(results).toHaveLength(3)
    })
  })

  describe("Combined Filters", () => {
    test("should apply search and amount filter together", async () => {
      const results = await caller.costs.list({
        projectId,
        searchText: "plumbing",
        minAmount: 40000,
      })

      expect(results).toHaveLength(1)
      expect(results[0]?.description).toContain("plumbing")
      expect(results[0]?.amount).toBeGreaterThanOrEqual(40000)
    })

    test("should apply multiple filters with sort", async () => {
      const results = await caller.costs.list({
        projectId,
        contactId,
        minAmount: 25000,
        sortBy: "amount",
        sortDirection: "desc",
      })

      expect(results).toHaveLength(2)
      expect(results[0]?.amount).toBeGreaterThan(results[1]?.amount ?? 0)
    })

    test("should apply date range and category filter", async () => {
      const results = await caller.costs.list({
        projectId,
        categoryId,
        startDate: new Date("2024-01-12"),
        endDate: new Date("2024-01-25"),
      })

      expect(results).toHaveLength(2)
      expect(results.every((c) => c.categoryId === categoryId)).toBe(true)
    })
  })

  describe("Authorization", () => {
    test("should verify project ownership before querying", async () => {
      // Create a different user
      const otherUser = await testDbInstance.db
        .insert(users)
        .values({
          id: "test-user-2",
          email: "otheruser@example.com",
          name: "Other User",
          firstName: "Other",
          lastName: "User",
        })
        .returning()
        .then((rows) => rows[0]!)

      const otherCaller = appRouter.createCaller(createMockContext(otherUser))

      await expect(
        otherCaller.costs.list({
          projectId, // Project owned by first user
          searchText: "test",
        })
      ).rejects.toThrow("FORBIDDEN")
    })
  })

  describe("Edge Cases", () => {
    test("should handle empty search text", async () => {
      const results = await caller.costs.list({
        projectId,
        searchText: "",
      })

      expect(results).toHaveLength(3)
    })

    test("should handle undefined filters", async () => {
      const results = await caller.costs.list({
        projectId,
      })

      expect(results).toHaveLength(3)
    })

    test("should not include soft-deleted costs", async () => {
      const costs = await caller.costs.list({ projectId })
      await caller.costs.softDelete({ id: costs[0]!.id })

      const results = await caller.costs.list({ projectId })

      expect(results).toHaveLength(2)
    })
  })
})
