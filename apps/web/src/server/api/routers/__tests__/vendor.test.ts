/**
 * Vendor Router Tests
 *
 * Tests vendor performance metrics and rating functionality including:
 * - RBAC enforcement (owner, partner, unauthorized access)
 * - Vendor metrics calculation accuracy
 * - Rating CRUD operations with ownership validation
 * - Vendor comparison with filters
 * - Dashboard data aggregation
 *
 * Story 9.3: Vendor Performance Metrics & Rating System
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { categories } from "@/server/db/schema/categories"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { vendorRatings } from "@/server/db/schema/vendor-ratings"

describe("Vendor Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let owner: User
  let partner: User
  let unauthorized: User
  let ownerCaller: ReturnType<typeof appRouter.createCaller>
  let partnerCaller: ReturnType<typeof appRouter.createCaller>
  let unauthorizedCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let project2Id: string
  let vendorId: string
  let vendor2Id: string
  let categoryId: string

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

    // Create test users
    owner = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000001",
        email: "owner@example.com",
        name: "Project Owner",
        firstName: "Project",
        lastName: "Owner",
      })
      .returning()
      .then((rows) => rows[0]!)

    partner = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000002",
        email: "partner@example.com",
        name: "Partner User",
        firstName: "Partner",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    unauthorized = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000003",
        email: "unauthorized@example.com",
        name: "Unauthorized User",
        firstName: "Unauthorized",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    // Create callers with proper context
    ownerCaller = appRouter.createCaller(createMockContext(owner))
    partnerCaller = appRouter.createCaller(createMockContext(partner))
    unauthorizedCaller = appRouter.createCaller(createMockContext(unauthorized))

    // Create test category
    const category = await testDbInstance.db
      .insert(categories)
      .values({
        id: "materials",
        type: "cost",
        displayName: "Materials",
      })
      .returning()
      .then((rows) => rows[0]!)
    categoryId = category.id

    // Create test project owned by owner
    const project = await testDbInstance.db
      .insert(projects)
      .values({
        id: "10000000-0000-0000-0000-000000000001",
        name: "Test Project 1",
        projectType: "renovation",
        status: "planning",
        ownerId: owner.id,
      })
      .returning()
      .then((rows) => rows[0]!)
    projectId = project.id

    // Create second project
    const project2 = await testDbInstance.db
      .insert(projects)
      .values({
        id: "10000000-0000-0000-0000-000000000002",
        name: "Test Project 2",
        projectType: "new_build",
        status: "in_progress",
        ownerId: owner.id,
      })
      .returning()
      .then((rows) => rows[0]!)
    project2Id = project2.id

    // Add partner to project1
    await testDbInstance.db.insert(projectAccess).values({
      projectId: projectId,
      userId: partner.id,
      invitedBy: owner.id,
      acceptedAt: new Date(),
    })

    // Create test vendors (contacts)
    const vendor = await testDbInstance.db
      .insert(contacts)
      .values({
        id: "20000000-0000-0000-0000-000000000001",
        firstName: "John",
        lastName: "Electrician",
        categoryId: categoryId,
      })
      .returning()
      .then((rows) => rows[0]!)
    vendorId = vendor.id

    const vendor2 = await testDbInstance.db
      .insert(contacts)
      .values({
        id: "20000000-0000-0000-0000-000000000002",
        firstName: "Jane",
        lastName: "Plumber",
        categoryId: categoryId,
      })
      .returning()
      .then((rows) => rows[0]!)
    vendor2Id = vendor2.id

    // Create test costs linking vendors to projects
    await testDbInstance.db.insert(costs).values([
      {
        projectId: projectId,
        amount: 50000, // $500
        description: "Electrical work",
        categoryId: categoryId,
        date: new Date("2024-01-15"),
        contactId: vendorId,
        createdById: owner.id,
      },
      {
        projectId: projectId,
        amount: 75000, // $750
        description: "More electrical",
        categoryId: categoryId,
        date: new Date("2024-02-20"),
        contactId: vendorId,
        createdById: owner.id,
      },
      {
        projectId: project2Id,
        amount: 100000, // $1000
        description: "Plumbing",
        categoryId: categoryId,
        date: new Date("2024-03-10"),
        contactId: vendor2Id,
        createdById: owner.id,
      },
    ])
  })

  describe("getVendorMetrics", () => {
    test("owner can view vendor metrics", async () => {
      const result = await ownerCaller.vendor.getVendorMetrics({
        contactId: vendorId,
      })

      expect(result.contactId).toBe(vendorId)
      expect(result.totalProjects).toBe(1)
      expect(result.totalSpent).toBe(125000) // $500 + $750
      expect(result.averageCost).toBeGreaterThan(0)
      expect(result.frequency).toBeGreaterThan(0)
      expect(result.categorySpecialization).toHaveLength(1)
      expect(result.ratingCount).toBe(0)
      expect(result.averageRating).toBe(null)
    })

    test("partner can view vendor metrics for shared project", async () => {
      const result = await partnerCaller.vendor.getVendorMetrics({
        contactId: vendorId,
      })

      expect(result.contactId).toBe(vendorId)
      expect(result.totalProjects).toBe(1)
      expect(result.totalSpent).toBe(125000)
    })

    test("unauthorized user cannot view vendor metrics", async () => {
      await expect(
        unauthorizedCaller.vendor.getVendorMetrics({
          contactId: vendorId,
        })
      ).rejects.toThrow()
    })

    test("calculates metrics correctly with ratings", async () => {
      // Add rating
      await testDbInstance.db.insert(vendorRatings).values({
        userId: owner.id,
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
        review: "Excellent work!",
      })

      await testDbInstance.db.insert(vendorRatings).values({
        userId: partner.id,
        contactId: vendorId,
        projectId: projectId,
        rating: 4,
        review: "Good job",
      })

      const result = await ownerCaller.vendor.getVendorMetrics({
        contactId: vendorId,
      })

      expect(result.ratingCount).toBe(2)
      expect(result.averageRating).toBe(4.5)
    })
  })

  describe("createVendorRating", () => {
    test("owner can rate vendor on their project", async () => {
      const result = await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
        review: "Great work!",
      })

      expect(result.userId).toBe(owner.id)
      expect(result.contactId).toBe(vendorId)
      expect(result.projectId).toBe(projectId)
      expect(result.rating).toBe(5)
      expect(result.review).toBe("Great work!")
    })

    test("partner can rate vendor on shared project", async () => {
      const result = await partnerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 4,
        review: "Good work!",
      })

      expect(result.userId).toBe(partner.id)
      expect(result.rating).toBe(4)
    })

    test("unauthorized user cannot rate vendor", async () => {
      await expect(
        unauthorizedCaller.vendor.createVendorRating({
          contactId: vendorId,
          projectId: projectId,
          rating: 5,
        })
      ).rejects.toThrow()
    })

    test("cannot rate vendor not associated with project", async () => {
      await expect(
        ownerCaller.vendor.createVendorRating({
          contactId: vendor2Id, // vendor2 not in project1
          projectId: projectId,
          rating: 5,
        })
      ).rejects.toThrow("not associated with this project")
    })

    test("validates rating range", async () => {
      await expect(
        ownerCaller.vendor.createVendorRating({
          contactId: vendorId,
          projectId: projectId,
          rating: 0, // Invalid
        })
      ).rejects.toThrow()

      await expect(
        ownerCaller.vendor.createVendorRating({
          contactId: vendorId,
          projectId: projectId,
          rating: 6, // Invalid
        })
      ).rejects.toThrow()
    })

    test("validates review length", async () => {
      const longReview = "a".repeat(501)

      await expect(
        ownerCaller.vendor.createVendorRating({
          contactId: vendorId,
          projectId: projectId,
          rating: 5,
          review: longReview,
        })
      ).rejects.toThrow()
    })

    test("prevents duplicate ratings", async () => {
      // Create first rating
      await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      // Attempt duplicate
      await expect(
        ownerCaller.vendor.createVendorRating({
          contactId: vendorId,
          projectId: projectId,
          rating: 4,
        })
      ).rejects.toThrow("already rated")
    })
  })

  describe("updateVendorRating", () => {
    test("user can update their own rating", async () => {
      // Create rating
      const created = await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 4,
        review: "Good",
      })

      // Update rating
      const updated = await ownerCaller.vendor.updateVendorRating({
        ratingId: created.id,
        rating: 5,
        review: "Excellent!",
      })

      expect(updated.rating).toBe(5)
      expect(updated.review).toBe("Excellent!")
    })

    test("user cannot update another user's rating", async () => {
      // Owner creates rating
      const created = await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      // Partner tries to update it
      await expect(
        partnerCaller.vendor.updateVendorRating({
          ratingId: created.id,
          rating: 3,
        })
      ).rejects.toThrow()
    })
  })

  describe("deleteVendorRating", () => {
    test("user can delete their own rating", async () => {
      // Create rating
      const created = await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      // Delete rating
      await ownerCaller.vendor.deleteVendorRating({
        ratingId: created.id,
      })

      // Verify deleted (soft delete)
      const ratings = await testDbInstance.db
        .select()
        .from(vendorRatings)
        .where((t) => t.id === created.id)
      expect(ratings[0]!.deletedAt).not.toBe(null)
    })

    test("user cannot delete another user's rating", async () => {
      // Owner creates rating
      const created = await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      // Partner tries to delete it
      await expect(
        partnerCaller.vendor.deleteVendorRating({
          ratingId: created.id,
        })
      ).rejects.toThrow()
    })
  })

  describe("getVendorRatings", () => {
    test("returns all ratings for vendor", async () => {
      await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
        review: "Excellent",
      })

      await partnerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 4,
        review: "Good",
      })

      const result = await ownerCaller.vendor.getVendorRatings({
        contactId: vendorId,
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.projectName).toBe("Test Project 1")
    })

    test("unauthorized user cannot view ratings", async () => {
      await expect(
        unauthorizedCaller.vendor.getVendorRatings({
          contactId: vendorId,
        })
      ).rejects.toThrow()
    })
  })

  describe("compareVendors", () => {
    test("compares multiple vendors", async () => {
      const result = await ownerCaller.vendor.compareVendors({
        contactIds: [vendorId, vendor2Id],
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.vendor.id).toBe(vendorId)
      expect(result[1]!.vendor.id).toBe(vendor2Id)
    })

    test("filters by minimum rating", async () => {
      // Add ratings
      await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      await ownerCaller.vendor.createVendorRating({
        contactId: vendor2Id,
        projectId: project2Id,
        rating: 3,
      })

      const result = await ownerCaller.vendor.compareVendors({
        contactIds: [vendorId, vendor2Id],
        filters: {
          minRating: 4,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.vendor.id).toBe(vendorId)
    })

    test("enforces max 5 vendors", async () => {
      await expect(
        ownerCaller.vendor.compareVendors({
          contactIds: ["id1", "id2", "id3", "id4", "id5", "id6"],
        })
      ).rejects.toThrow()
    })
  })

  describe("getVendorPerformanceDashboard", () => {
    test("returns dashboard data for user's vendors", async () => {
      // Add rating to make vendor top-rated
      await ownerCaller.vendor.createVendorRating({
        contactId: vendorId,
        projectId: projectId,
        rating: 5,
      })

      const result = await ownerCaller.vendor.getVendorPerformanceDashboard()

      expect(result.topRatedVendors.length).toBeGreaterThan(0)
      expect(result.mostUsedVendors.length).toBeGreaterThan(0)
      expect(result.vendorSpendDistribution.length).toBeGreaterThan(0)
    })

    test("returns empty data when user has no vendors", async () => {
      const result = await unauthorizedCaller.vendor.getVendorPerformanceDashboard()

      expect(result.topRatedVendors).toHaveLength(0)
      expect(result.mostUsedVendors).toHaveLength(0)
      expect(result.underutilizedVendors).toHaveLength(0)
      expect(result.recentVendors).toHaveLength(0)
      expect(result.vendorSpendDistribution).toHaveLength(0)
    })
  })
})
