/**
 * Portfolio Router Tests
 *
 * Tests portfolio analytics functionality including:
 * - RBAC enforcement (owner, partner, unauthorized access)
 * - Data aggregation accuracy (totals, categories, vendors, trends)
 * - Status filtering
 * - Date range filtering
 * - CSV export
 *
 * Story 9.2: Multi-Project Comparative Analytics
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
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

describe("Portfolio Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let owner: User
  let partner: User
  let unauthorized: User
  let ownerCaller: ReturnType<typeof appRouter.createCaller>
  let partnerCaller: ReturnType<typeof appRouter.createCaller>
  let unauthorizedCaller: ReturnType<typeof appRouter.createCaller>
  let project1Id: string
  let project2Id: string
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

    ownerCaller = appRouter.createCaller(createMockContext(owner))
    partnerCaller = appRouter.createCaller(createMockContext(partner))
    unauthorizedCaller = appRouter.createCaller(createMockContext(unauthorized))

    // Create test category
    const category = await testDbInstance.db
      .insert(categories)
      .values({
        id: "00000000-0000-0000-0000-000000000100",
        type: "cost",
        displayName: "Materials",
      })
      .returning()
      .then((rows) => rows[0]!)
    categoryId = category.id

    // Create test contact (vendor)
    const contact = await testDbInstance.db
      .insert(contacts)
      .values({
        firstName: "John",
        lastName: "Vendor",
        company: "Vendor Co",
        email: "vendor@example.com",
        categoryId,
        createdById: owner.id,
      })
      .returning()
      .then((rows) => rows[0]!)
    contactId = contact.id

    // Create test projects
    const project1 = await ownerCaller.projects.create({
      name: "Project Alpha",
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
      },
      projectType: "new_build",
      status: "active",
      startDate: new Date("2025-01-01"),
      size: 1000, // 1000 sqm
    })
    project1Id = project1.id

    const project2 = await ownerCaller.projects.create({
      name: "Project Beta",
      address: {
        streetNumber: "456",
        streetName: "Main St",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
      projectType: "renovation",
      status: "active",
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-06-01"),
      size: 2000, // 2000 sqm
    })
    project2Id = project2.id

    // Create a third project owned by unauthorized user
    await testDbInstance.db
      .insert(projects)
      .values({
        name: "Project Gamma",
        address: JSON.stringify({
          streetNumber: "789",
          streetName: "Third St",
          suburb: "Brisbane",
          state: "QLD",
          postcode: "4000",
          country: "Australia",
        }),
        projectType: "development",
        status: "on_hold",
        startDate: new Date("2025-03-01"),
        ownerId: unauthorized.id, // Owned by unauthorized user
        size: 1500,
      })
      .returning()
      .then((rows) => rows[0]!)

    // Add partner access to project2 with accepted invitation
    await testDbInstance.db.insert(projectAccess).values({
      projectId: project2Id,
      userId: partner.id,
      permission: "read",
      invitedAt: new Date(),
      acceptedAt: new Date(), // Accepted invitation
    })

    // Create costs for analytics testing
    await testDbInstance.db.insert(costs).values([
      // Project 1 costs
      {
        projectId: project1Id,
        amount: 10000, // $100
        description: "Materials for Project Alpha",
        categoryId,
        date: new Date("2025-01-15"),
        createdById: owner.id,
        contactId,
      },
      {
        projectId: project1Id,
        amount: 20000, // $200
        description: "More materials",
        categoryId,
        date: new Date("2025-02-15"),
        createdById: owner.id,
        contactId,
      },
      // Project 2 costs
      {
        projectId: project2Id,
        amount: 30000, // $300
        description: "Materials for Project Beta",
        categoryId,
        date: new Date("2025-03-15"),
        createdById: owner.id,
        contactId,
      },
      {
        projectId: project2Id,
        amount: 40000, // $400
        description: "More materials for Beta",
        categoryId,
        date: new Date("2025-04-15"),
        createdById: owner.id,
        contactId,
      },
    ])
  })

  describe("getPortfolioProjects", () => {
    describe("RBAC - Owner Access", () => {
      test("owner can access their own projects", async () => {
        const result = await ownerCaller.portfolio.getPortfolioProjects()

        expect(result.projects).toHaveLength(2) // project1 and project2
        expect(result.totalCount).toBe(2)
        expect(result.projects.map((p) => p.name)).toContain("Project Alpha")
        expect(result.projects.map((p) => p.name)).toContain("Project Beta")
      })

      test("owner cannot access projects they don't own", async () => {
        const result = await ownerCaller.portfolio.getPortfolioProjects()

        expect(result.projects.map((p) => p.name)).not.toContain("Project Gamma")
      })
    })

    describe("RBAC - Partner Access", () => {
      test("partner can access projects with accepted invitation", async () => {
        const result = await partnerCaller.portfolio.getPortfolioProjects()

        expect(result.projects).toHaveLength(1) // Only project2 where partner has access
        expect(result.totalCount).toBe(1)
        expect(result.projects[0]!.name).toBe("Project Beta")
      })

      test("partner cannot access projects without accepted invitation", async () => {
        const result = await partnerCaller.portfolio.getPortfolioProjects()

        expect(result.projects.map((p) => p.name)).not.toContain("Project Alpha")
        expect(result.projects.map((p) => p.name)).not.toContain("Project Gamma")
      })
    })

    describe("RBAC - Unauthorized Access", () => {
      test("user with no access to any projects gets empty list", async () => {
        // Create a new user with no project access
        const noAccessUser = await testDbInstance.db
          .insert(users)
          .values({
            id: "00000000-0000-0000-0000-000000000004",
            email: "noaccess@example.com",
            name: "No Access User",
            firstName: "No",
            lastName: "Access",
          })
          .returning()
          .then((rows) => rows[0]!)

        const noAccessCaller = appRouter.createCaller(createMockContext(noAccessUser))
        const result = await noAccessCaller.portfolio.getPortfolioProjects()

        expect(result.projects).toHaveLength(0)
        expect(result.totalCount).toBe(0)
      })
    })
  })

  describe("getPortfolioAnalytics", () => {
    describe("RBAC - Access Control", () => {
      test("owner can access analytics for their projects", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.summary.projectCount).toBe(2)
        expect(result.summary.totalCosts).toBe(100000) // 100+200+300+400 = $1000 in cents
      })

      test("partner can access analytics for projects they have access to", async () => {
        const result = await partnerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project2Id],
        })

        expect(result.summary.projectCount).toBe(1)
        expect(result.summary.totalCosts).toBe(70000) // 300+400 = $700 in cents
      })

      test("throws FORBIDDEN when user lacks access to selected project", async () => {
        await expect(
          unauthorizedCaller.portfolio.getPortfolioAnalytics({
            projectIds: [project1Id], // Owned by owner, not unauthorized
          })
        ).rejects.toThrow(TRPCError)
      })

      test("throws FORBIDDEN when user tries to mix accessible and inaccessible projects", async () => {
        // Partner has access to project2 but not project1
        await expect(
          partnerCaller.portfolio.getPortfolioAnalytics({
            projectIds: [project1Id, project2Id],
          })
        ).rejects.toThrow(TRPCError)
      })
    })

    describe("Data Aggregation - Portfolio Totals", () => {
      test("calculates correct total portfolio value", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.summary.totalCosts).toBe(100000) // 10000+20000+30000+40000
        expect(result.summary.costCount).toBe(4)
        expect(result.summary.projectCount).toBe(2)
      })

      test("calculates correct average per project", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.summary.averageProjectCost).toBe(50000) // 100000 / 2 projects
      })
    })

    describe("Data Aggregation - Cost Per Square Meter", () => {
      test("calculates cost per sqm correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        const project1Data = result.costPerSqft.find((p) => p.projectId === project1Id)
        const project2Data = result.costPerSqft.find((p) => p.projectId === project2Id)

        expect(project1Data).toBeDefined()
        expect(project2Data).toBeDefined()

        // Project 1: $300 total / 1000 sqm = $0.30/sqm = 30 cents
        expect(project1Data!.costPerSqft).toBe(30)
        expect(project1Data!.totalCost).toBe(30000)
        expect(project1Data!.size).toBe(1000)

        // Project 2: $700 total / 2000 sqm = $0.35/sqm = 35 cents
        expect(project2Data!.costPerSqft).toBe(35)
        expect(project2Data!.totalCost).toBe(70000)
        expect(project2Data!.size).toBe(2000)
      })

      test("excludes projects without size field", async () => {
        // Update project1 to have null size
        await testDbInstance.db
          .update(projects)
          .set({ size: null })
          .where(eq(projects.id, project1Id))

        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        const project1Data = result.costPerSqft.find((p) => p.projectId === project1Id)
        expect(project1Data).toBeUndefined() // Should be excluded

        const project2Data = result.costPerSqft.find((p) => p.projectId === project2Id)
        expect(project2Data).toBeDefined() // Should still be included
      })
    })

    describe("Data Aggregation - Category Spend", () => {
      test("aggregates category spend across projects correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.categorySpendByProject.length).toBeGreaterThan(0)

        // Find all entries for our category
        const categoryEntries = result.categorySpendByProject.filter(
          (c) => c.categoryId === categoryId
        )

        expect(categoryEntries).toHaveLength(2) // One per project

        const project1Entry = categoryEntries.find((c) => c.projectId === project1Id)
        const project2Entry = categoryEntries.find((c) => c.projectId === project2Id)

        expect(project1Entry!.total).toBe(30000) // 100+200 = $300
        expect(project2Entry!.total).toBe(70000) // 300+400 = $700
      })
    })

    describe("Data Aggregation - Timeline Duration", () => {
      test("calculates project duration correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        const project2Duration = result.projectDurations.find((p) => p.projectId === project2Id)

        expect(project2Duration).toBeDefined()
        // Feb 1 to June 1 = 4 months = ~120 days
        expect(project2Duration!.durationDays).toBeGreaterThan(100)
        expect(project2Duration!.durationDays).toBeLessThan(130)
      })

      test("excludes projects without end date", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        const project1Duration = result.projectDurations.find((p) => p.projectId === project1Id)
        expect(project1Duration).toBeUndefined() // No end date, should be excluded
      })
    })

    describe("Data Aggregation - Cost Trends", () => {
      test("groups costs by month correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.costTrends.length).toBeGreaterThan(0)

        // Should have entries for multiple months
        const months = [...new Set(result.costTrends.map((t) => t.month))]
        expect(months.length).toBeGreaterThanOrEqual(4) // Jan, Feb, Mar, Apr

        // Check January costs (project1)
        const jan2025 = result.costTrends.find((t) => t.month === "2025-01")
        expect(jan2025).toBeDefined()
        expect(jan2025!.total).toBe(10000) // $100

        // Check February costs (project1)
        const feb2025 = result.costTrends.find((t) => t.month === "2025-02")
        expect(feb2025).toBeDefined()
        expect(feb2025!.total).toBe(20000) // $200
      })
    })

    describe("Data Aggregation - Top Vendors", () => {
      test("aggregates vendor usage correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        expect(result.topVendors).toHaveLength(1) // One vendor used

        const vendor = result.topVendors[0]!
        expect(vendor.vendorId).toBe(contactId)
        expect(vendor.vendorName).toBe("John Vendor")
        expect(vendor.company).toBe("Vendor Co")
        expect(vendor.projectCount).toBe(2) // Used in 2 projects
        expect(vendor.totalSpent).toBe(100000) // All costs: 100+200+300+400 = $1000
      })

      test("calculates average per project correctly", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
        })

        const vendor = result.topVendors[0]!
        expect(vendor.avgPerProject).toBe(50000) // $1000 / 2 projects = $500 per project
      })
    })

    describe("Status Filtering", () => {
      test("filters projects by active status", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
          statusFilter: ["active"],
        })

        // Both projects are active, should include all costs
        expect(result.summary.totalCosts).toBe(100000)
        expect(result.summary.projectCount).toBe(2)
      })

      test("filters projects by on_hold status", async () => {
        // Update project2 to on_hold
        await testDbInstance.db
          .update(projects)
          .set({ status: "on_hold" })
          .where(eq(projects.id, project2Id))

        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
          statusFilter: ["on_hold"],
        })

        // Only project2 is on_hold
        expect(result.summary.projectCount).toBe(1)
        expect(result.summary.totalCosts).toBe(70000) // Only project2 costs
      })

      test("returns empty data when status filter matches no projects", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
          statusFilter: ["completed"],
        })

        expect(result.summary.projectCount).toBe(0)
        expect(result.summary.totalCosts).toBe(0)
        expect(result.costPerSqft).toHaveLength(0)
        expect(result.categorySpendByProject).toHaveLength(0)
      })
    })

    describe("Date Range Filtering", () => {
      test("filters costs by date range", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
          dateRange: {
            start: new Date("2025-03-01"),
            end: new Date("2025-05-01"),
          },
        })

        // Should only include costs from March and April
        // March: $300, April: $400 = $700 total
        expect(result.summary.totalCosts).toBe(70000)
        expect(result.summary.costCount).toBe(2)
      })

      test("excludes costs outside date range", async () => {
        const result = await ownerCaller.portfolio.getPortfolioAnalytics({
          projectIds: [project1Id, project2Id],
          dateRange: {
            start: new Date("2025-01-01"),
            end: new Date("2025-02-28"),
          },
        })

        // Should only include January and February costs
        // January: $100, February: $200 = $300 total
        expect(result.summary.totalCosts).toBe(30000)
        expect(result.summary.costCount).toBe(2)
      })
    })
  })

  describe("exportPortfolioData", () => {
    test("generates CSV with correct structure", async () => {
      const result = await ownerCaller.portfolio.exportPortfolioData({
        projectIds: [project1Id, project2Id],
        format: "csv",
      })

      expect(result.filename).toMatch(/portfolio-analytics-\d{4}-\d{2}-\d{2}\.csv/)
      expect(result.content).toContain("Project Name")
      expect(result.content).toContain("Total Cost")
      expect(result.content).toContain("Project Alpha")
      expect(result.content).toContain("Project Beta")
    })

    test("CSV escapes special characters to prevent formula injection", async () => {
      // Create a project with potentially dangerous name
      const dangerousProject = await ownerCaller.projects.create({
        name: "=MALICIOUS()",
        address: {
          streetNumber: "999",
          streetName: "Danger St",
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "new_build",
        status: "active",
        startDate: new Date("2025-01-01"),
      })

      const result = await ownerCaller.portfolio.exportPortfolioData({
        projectIds: [dangerousProject.id],
        format: "csv",
      })

      // Should escape leading = to prevent formula execution
      expect(result.content).toContain("'=MALICIOUS()")
      expect(result.content).not.toMatch(/^=MALICIOUS\(\)/m)
    })

    test("throws FORBIDDEN when user lacks access", async () => {
      await expect(
        unauthorizedCaller.portfolio.exportPortfolioData({
          projectIds: [project1Id],
          format: "csv",
        })
      ).rejects.toThrow(TRPCError)
    })
  })
})
