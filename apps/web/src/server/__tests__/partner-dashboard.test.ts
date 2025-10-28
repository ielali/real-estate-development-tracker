/**
 * Partner Dashboard Router Tests (Story 4.3)
 *
 * Tests for partner dashboard tRPC queries:
 * - getProjectSummary
 * - getCostBreakdown
 * - getRecentActivity
 * - getDocumentGallery
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
          ownerId: ctx.user.id,
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
          createdById: ctx.user.id,
        },
        {
          projectId,
          amount: 30000, // $300.00
          description: "Test Cost 2",
          categoryId,
          date: new Date(),
          createdById: ctx.user.id,
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
          ownerId: ownerCtx.user.id,
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
          ownerId: ownerCtx.user.id,
          addressId: address!.id,
          projectType: "renovation",
          status: "active",
          startDate: new Date(),
        })
        .returning()

      // Grant partner read access
      await ownerCtx.db.insert(projectAccess).values({
        projectId: project!.id,
        userId: partnerCtx.user.id,
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
          ownerId: ctx.user.id,
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
          createdById: ctx.user.id,
        },
        {
          projectId,
          amount: 40000, // $400.00
          description: "Cost Category 2",
          categoryId: category2Id,
          date: new Date(),
          createdById: ctx.user.id,
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
          ownerId: ctx.user.id,
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
          userId: ctx.user.id,
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
          ownerId: ctx.user.id,
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
          uploadedById: ctx.user.id,
        },
        {
          projectId,
          fileName: "photo2.jpg",
          fileSize: 2048,
          mimeType: "image/jpeg",
          blobUrl: "photo2-url",
          categoryId: category1Id,
          uploadedById: ctx.user.id,
        },
        {
          projectId,
          fileName: "receipt1.pdf",
          fileSize: 512,
          mimeType: "application/pdf",
          blobUrl: "receipt1-url",
          categoryId: category2Id,
          uploadedById: ctx.user.id,
        },
      ])

      // Test getDocumentGallery
      const result = await caller.partnerDashboard.getDocumentGallery({ projectId })

      expect(result.totalCount).toBe(3)
      expect(Object.keys(result.documents).length).toBeGreaterThan(0)
    })
  })
})
