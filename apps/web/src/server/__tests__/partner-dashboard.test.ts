/**
 * Partner Dashboard Router Tests (Story 4.3 + 4.4)
 *
 * Tests for partner dashboard tRPC queries:
 * - getProjectSummary
 * - getCostBreakdown
 * - getRecentActivity
 * - getDocumentGallery
 * - getSpendingTrend (Story 4.4)
 * - getVendorDistribution (Story 4.4)
 * - getBudgetComparison (Story 4.4)
 * - getProjectTimeline (Story 4.4)
 *
 * Access Control Tests:
 * - Partners can only access assigned projects
 * - Admin can access all owned project data
 * - Soft-deleted entities are excluded from results
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { appRouter } from "../api/root"
import { createTestContext, createTestDb } from "@/test/test-db"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { categories } from "@/server/db/schema/categories"
import { documents } from "@/server/db/schema/documents"
import { auditLog } from "@/server/db/schema/auditLog"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { addresses } from "@/server/db/schema/addresses"
import { contacts } from "@/server/db/schema/contacts"
import { events } from "@/server/db/schema/events"

describe("Partner Dashboard Router", () => {
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  describe("getProjectSummary", () => {
    test("returns project summary with metrics for project owner", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address first
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get a category (categories are pre-seeded)
      const allCategories = await ctx.db.select().from(categories).limit(1)
      const categoryId = allCategories[0]!.id

      // Add costs
      await ctx.db.insert(costs).values([
        {
          projectId,
          amount: 50000, // $500.00
          description: "Test Cost 1",
          categoryId,
          date: new Date(),
          createdById: ctx.user!.id,
        },
        {
          projectId,
          amount: 30000, // $300.00
          description: "Test Cost 2",
          categoryId,
          date: new Date(),
          createdById: ctx.user!.id,
        },
      ])

      // Test getProjectSummary
      const result = await caller.partnerDashboard.getProjectSummary({ projectId })

      expect(result).toMatchObject({
        project: expect.objectContaining({
          id: projectId,
          name: "Test Project",
        }),
        totalSpent: 80000, // $800.00
        documentCount: 0,
        recentActivityCount: 0,
      })
      expect(result.costBreakdown.length).toBeGreaterThan(0)
    })

    test("throws FORBIDDEN for partner without access", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create address
      const [address] = await ownerCtx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project owned by another user
      const [project] = await ownerCtx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ownerCtx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      // Test getProjectSummary without granting access
      await expect(
        partnerCaller.partnerDashboard.getProjectSummary({ projectId: project!.id })
      ).rejects.toThrow("Project not found or you do not have access")
    })

    test("returns project summary for partner with read access", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create address
      const [address] = await ownerCtx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project owned by another user
      const [project] = await ownerCtx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ownerCtx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      // Grant partner read access
      await ownerCtx.db.insert(projectAccess).values({
        projectId: project!.id,
        userId: partnerCtx.user!.id,
        permission: "read",
        acceptedAt: new Date(),
      })

      // Test getProjectSummary
      const result = await partnerCaller.partnerDashboard.getProjectSummary({
        projectId: project!.id,
      })

      expect(result).toMatchObject({
        project: expect.objectContaining({
          id: project!.id,
        }),
        totalSpent: 0, // No costs added
        documentCount: 0,
        recentActivityCount: 0,
      })
    })
  })

  describe("getCostBreakdown", () => {
    test("returns cost breakdown with percentages", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get two different categories
      const allCategories = await ctx.db.select().from(categories).limit(2)
      const category1Id = allCategories[0]!.id
      const category2Id = allCategories[1]!.id

      // Add costs: 60% vs 40%
      await ctx.db.insert(costs).values([
        {
          projectId,
          amount: 60000, // $600.00
          description: "Cost Category 1",
          categoryId: category1Id,
          date: new Date(),
          createdById: ctx.user!.id,
        },
        {
          projectId,
          amount: 40000, // $400.00
          description: "Cost Category 2",
          categoryId: category2Id,
          date: new Date(),
          createdById: ctx.user!.id,
        },
      ])

      // Test getCostBreakdown
      const result = await caller.partnerDashboard.getCostBreakdown({ projectId })

      expect(result.grandTotal).toBe(100000)
      expect(result.breakdown).toHaveLength(2)
      expect(result.breakdown[0]!.percentage).toBeCloseTo(60, 0)
      expect(result.breakdown[1]!.percentage).toBeCloseTo(40, 0)
    })
  })

  describe("getRecentActivity", () => {
    test("returns paginated audit log entries", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Add audit log entries
      for (let i = 0; i < 25; i++) {
        await ctx.db.insert(auditLog).values({
          projectId,
          userId: ctx.user!.id,
          action: "CREATE",
          entityType: "cost",
          entityId: `test-id-${i}`,
        })
      }

      // Test getRecentActivity with default pagination
      const result = await caller.partnerDashboard.getRecentActivity({
        projectId,
      })

      expect(result.activities).toHaveLength(20) // Default limit
      expect(result.totalCount).toBe(25)
      expect(result.hasMore).toBe(true)

      // Test with offset
      const result2 = await caller.partnerDashboard.getRecentActivity({
        projectId,
        offset: 20,
      })

      expect(result2.activities).toHaveLength(5)
      expect(result2.hasMore).toBe(false)
    })
  })

  describe("getDocumentGallery", () => {
    test("returns documents grouped by category", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get categories for documents (should have photo, receipt, etc from seed data)
      const photoCategories = await ctx.db.select().from(categories).limit(2)
      const category1Id = photoCategories[0]!.id
      const category2Id = photoCategories[1]!.id

      // Add documents
      await ctx.db.insert(documents).values([
        {
          projectId,
          fileName: "photo1.jpg",
          fileSize: 1024,
          mimeType: "image/jpeg",
          blobUrl: "photo1-url",
          categoryId: category1Id,
          uploadedById: ctx.user!.id,
        },
        {
          projectId,
          fileName: "photo2.jpg",
          fileSize: 2048,
          mimeType: "image/jpeg",
          blobUrl: "photo2-url",
          categoryId: category1Id,
          uploadedById: ctx.user!.id,
        },
        {
          projectId,
          fileName: "receipt1.pdf",
          fileSize: 512,
          mimeType: "application/pdf",
          blobUrl: "receipt1-url",
          categoryId: category2Id,
          uploadedById: ctx.user!.id,
        },
      ])

      // Test getDocumentGallery
      const result = await caller.partnerDashboard.getDocumentGallery({ projectId })

      expect(result.totalCount).toBe(3)
      expect(Object.keys(result.documents).length).toBeGreaterThan(0)
    })
  })

  describe("getSpendingTrend (Story 4.4)", () => {
    test("returns daily spending trend with cumulative totals", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get category
      const allCategories = await ctx.db.select().from(categories).limit(1)
      const categoryId = allCategories[0]!.id

      // Add costs on different dates
      const date1 = new Date("2025-01-01")
      const date2 = new Date("2025-01-02")
      const date3 = new Date("2025-01-03")

      await ctx.db.insert(costs).values([
        {
          projectId,
          amount: 50000, // $500.00
          description: "Cost 1",
          categoryId,
          date: date1,
          createdById: ctx.user!.id,
        },
        {
          projectId,
          amount: 75000, // $750.00
          description: "Cost 2",
          categoryId,
          date: date2,
          createdById: ctx.user!.id,
        },
        {
          projectId,
          amount: 25000, // $250.00
          description: "Cost 3",
          categoryId,
          date: date3,
          createdById: ctx.user!.id,
        },
      ])

      // Test getSpendingTrend
      const result = await caller.partnerDashboard.getSpendingTrend({
        projectId,
        timeRange: "daily",
      })

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        amount: 50000,
        cumulativeAmount: 50000,
      })
      expect(result[1]).toMatchObject({
        amount: 75000,
        cumulativeAmount: 125000,
      })
      expect(result[2]).toMatchObject({
        amount: 25000,
        cumulativeAmount: 150000,
      })
    })

    test("throws FORBIDDEN for partner without access", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create address
      const [address] = await ownerCtx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project owned by another user
      const [project] = await ownerCtx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ownerCtx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      // Test without access
      await expect(
        partnerCaller.partnerDashboard.getSpendingTrend({
          projectId: project!.id,
          timeRange: "daily",
        })
      ).rejects.toThrow("Project not found or you do not have access")
    })
  })

  describe("getVendorDistribution (Story 4.4)", () => {
    test("returns vendor spending distribution with percentages", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get category
      const allCategories = await ctx.db.select().from(categories).limit(1)
      const categoryId = allCategories[0]!.id

      // Create vendor contact
      const [contact] = await ctx.db
        .insert(contacts)
        .values({
          firstName: "John",
          lastName: "Vendor",
          company: "Test Vendor Co",
          categoryId,
        })
        .returning()

      const contactId = contact!.id

      // Add costs with vendor
      await ctx.db.insert(costs).values([
        {
          projectId,
          amount: 60000, // $600.00
          description: "Cost with vendor",
          categoryId,
          date: new Date(),
          contactId,
          createdById: ctx.user!.id,
        },
        {
          projectId,
          amount: 40000, // $400.00
          description: "Cost without vendor",
          categoryId,
          date: new Date(),
          contactId: null,
          createdById: ctx.user!.id,
        },
      ])

      // Test getVendorDistribution
      const result = await caller.partnerDashboard.getVendorDistribution({ projectId })

      expect(result.grandTotal).toBe(100000)
      expect(result.distribution).toHaveLength(2)

      const vendorEntry = result.distribution.find(
        (d: { vendorId: string | null }) => d.vendorId === contactId
      )
      expect(vendorEntry).toMatchObject({
        vendorName: "Test Vendor Co",
        total: 60000,
        percentage: 60,
      })

      const unassignedEntry = result.distribution.find(
        (d: { vendorId: string | null }) => d.vendorId === null
      )
      expect(unassignedEntry).toMatchObject({
        vendorName: "Unassigned",
        total: 40000,
        percentage: 40,
      })
    })
  })

  describe("getBudgetComparison (Story 4.4)", () => {
    test("returns budget comparison with variance", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project with budget
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
          totalBudget: 200000, // $2000.00
        })
        .returning()

      const projectId = project!.id

      // Get category
      const allCategories = await ctx.db.select().from(categories).limit(1)
      const categoryId = allCategories[0]!.id

      // Add costs
      await ctx.db.insert(costs).values({
        projectId,
        amount: 150000, // $1500.00
        description: "Test Cost",
        categoryId,
        date: new Date(),
        createdById: ctx.user!.id,
      })

      // Test getBudgetComparison
      const result = await caller.partnerDashboard.getBudgetComparison({ projectId })

      expect(result).toMatchObject({
        budget: 200000,
        spent: 150000,
        variance: 50000,
        percentageUsed: 75,
      })
    })

    test("returns null when no budget is set", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project WITHOUT budget
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
          totalBudget: null,
        })
        .returning()

      // Test getBudgetComparison
      const result = await caller.partnerDashboard.getBudgetComparison({ projectId: project!.id })

      expect(result).toBeNull()
    })
  })

  describe("getProjectTimeline (Story 4.4)", () => {
    test("returns milestone events sorted by date", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create address
      const [address] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: "123",
          streetName: "Test",
          streetType: "Street",
          suburb: "Testville",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "123 Test Street, Testville VIC 3000",
        })
        .returning()

      // Create project
      const [project] = await ctx.db
        .insert(projects)
        .values({
          name: "Test Project",
          ownerId: ctx.user!.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      const projectId = project!.id

      // Get category
      const allCategories = await ctx.db.select().from(categories).limit(1)
      const categoryId = allCategories[0]!.id

      // Add events
      const date1 = new Date("2025-01-01")
      const date2 = new Date("2025-02-01")
      const date3 = new Date("2025-03-01")

      await ctx.db.insert(events).values([
        {
          projectId,
          title: "Project Start",
          description: "Kick-off meeting",
          date: date1,
          categoryId,
          createdById: ctx.user!.id,
        },
        {
          projectId,
          title: "Mid-point Review",
          description: "Progress check",
          date: date2,
          categoryId,
          createdById: ctx.user!.id,
        },
        {
          projectId,
          title: "Project Completion",
          description: "Final inspection",
          date: date3,
          categoryId,
          createdById: ctx.user!.id,
        },
      ])

      // Test getProjectTimeline
      const result = await caller.partnerDashboard.getProjectTimeline({ projectId })

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        title: "Project Start",
        description: "Kick-off meeting",
      })
      expect(result[1]).toMatchObject({
        title: "Mid-point Review",
      })
      expect(result[2]).toMatchObject({
        title: "Project Completion",
      })
    })
  })
})
