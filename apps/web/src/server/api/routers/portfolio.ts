import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { and, eq, inArray, isNull, or, sql, isNotNull, desc } from "drizzle-orm"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { categories } from "@/server/db/schema/categories"
import { contacts } from "@/server/db/schema/contacts"
import { projectAccess } from "@/server/db/schema/projectAccess"

/**
 * Portfolio Analytics Router
 *
 * Provides aggregated analytics across multiple projects for comparative analysis.
 * Includes cost-per-sqm, category comparisons, timeline durations, spending trends,
 * and vendor analytics.
 */
export const portfolioRouter = createTRPCRouter({
  /**
   * Get all projects user has access to (owner or accepted partner)
   * Returns project list for selection in portfolio dashboard
   */
  getPortfolioProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      })
    }

    // Get projects where user is owner or accepted partner
    const userProjects = await ctx.db
      .selectDistinct({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        projectType: projects.projectType,
        startDate: projects.startDate,
        endDate: projects.endDate,
        totalBudget: projects.totalBudget,
        size: projects.size,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(projectAccess, eq(projectAccess.projectId, projects.id))
      .where(
        and(
          isNull(projects.deletedAt),
          or(
            eq(projects.ownerId, userId), // User is owner
            and(
              eq(projectAccess.userId, userId), // User is partner
              isNotNull(projectAccess.acceptedAt)
            )
          )
        )
      )
      .orderBy(desc(projects.updatedAt))

    return {
      projects: userProjects,
      totalCount: userProjects.length,
    }
  }),

  /**
   * Get comprehensive portfolio analytics for selected projects
   * Includes all aggregations needed for dashboard charts
   */
  getPortfolioAnalytics: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()).min(1),
        dateRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
        statusFilter: z.array(z.enum(["active", "on_hold", "completed"])).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        })
      }

      // Verify user has access to all selected projects (RBAC enforcement)
      const accessibleProjects = await ctx.db
        .selectDistinct({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          startDate: projects.startDate,
          endDate: projects.endDate,
          size: projects.size,
          totalBudget: projects.totalBudget,
        })
        .from(projects)
        .leftJoin(projectAccess, eq(projectAccess.projectId, projects.id))
        .where(
          and(
            inArray(projects.id, input.projectIds),
            isNull(projects.deletedAt),
            or(
              eq(projects.ownerId, userId),
              and(eq(projectAccess.userId, userId), isNotNull(projectAccess.acceptedAt))
            )
          )
        )

      // Ensure user has access to ALL requested projects
      if (accessibleProjects.length !== input.projectIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to one or more selected projects",
        })
      }

      // Apply status filter to get filtered project IDs
      const filteredProjectIds =
        input.statusFilter && input.statusFilter.length > 0
          ? accessibleProjects
              .filter((p: (typeof accessibleProjects)[0]) =>
                input.statusFilter!.includes(p.status as "active" | "on_hold" | "completed")
              )
              .map((p: (typeof accessibleProjects)[0]) => p.id)
          : input.projectIds

      // If status filter results in no projects, return empty data
      if (filteredProjectIds.length === 0) {
        return {
          summary: {
            totalValue: 0,
            costCount: 0,
            projectCount: 0,
            avgPerProject: 0,
            averageProjectCost: 0,
            totalCosts: 0,
          },
          costPerSqft: [],
          projectDurations: [],
          categorySpendByProject: [],
          costTrends: [],
          commonCategories: [],
          topVendors: [],
          projects: [],
        }
      }

      // Build date range filter
      const dateRangeFilter = input.dateRange
        ? and(
            sql`${costs.date} >= ${input.dateRange.start}`,
            sql`${costs.date} <= ${input.dateRange.end}`
          )
        : sql`1=1`

      // 1. Total Portfolio Value
      const portfolioTotals = await ctx.db
        .select({
          totalValue: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS INTEGER)`,
          costCount: sql<number>`CAST(COUNT(${costs.id}) AS INTEGER)`,
        })
        .from(costs)
        .where(
          and(
            inArray(costs.projectId, filteredProjectIds),
            isNull(costs.deletedAt),
            dateRangeFilter
          )
        )

      // 2. Cost Per Square Meter (for projects with size data)
      const costPerSqft = await ctx.db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          size: projects.size,
          totalCost: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS INTEGER)`,
          costPerSqft: sql<number>`CASE
            WHEN ${projects.size} IS NOT NULL AND ${projects.size} > 0
            THEN CAST((COALESCE(SUM(${costs.amount}), 0) / ${projects.size}) AS INTEGER)
            ELSE NULL
          END`,
        })
        .from(projects)
        .leftJoin(costs, and(eq(costs.projectId, projects.id), isNull(costs.deletedAt)))
        .where(
          and(
            inArray(projects.id, filteredProjectIds),
            isNotNull(projects.size),
            sql`${projects.size} > 0`
          )
        )
        .groupBy(projects.id, projects.name, projects.size)

      // 3. Category Spend Comparison (cross-project)
      const categorySpendByProject = await ctx.db
        .select({
          projectId: costs.projectId,
          projectName: projects.name,
          categoryId: costs.categoryId,
          categoryName: categories.displayName,
          total: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
        })
        .from(costs)
        .leftJoin(projects, eq(costs.projectId, projects.id))
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(
          and(
            inArray(costs.projectId, filteredProjectIds),
            isNull(costs.deletedAt),
            dateRangeFilter
          )
        )
        .groupBy(costs.projectId, projects.name, costs.categoryId, categories.displayName)
        .orderBy(desc(sql`SUM(${costs.amount})`))

      // 4. Timeline Duration Comparison
      const projectDurations = await ctx.db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
          status: projects.status,
          durationDays: sql<number>`CASE
            WHEN ${projects.endDate} IS NOT NULL AND ${projects.startDate} IS NOT NULL
            THEN EXTRACT(DAY FROM ${projects.endDate} - ${projects.startDate})::integer
            ELSE NULL
          END`,
        })
        .from(projects)
        .where(and(inArray(projects.id, filteredProjectIds), isNull(projects.deletedAt)))
        .orderBy(desc(sql`EXTRACT(DAY FROM ${projects.endDate} - ${projects.startDate})`))

      // 5. Cost Trends Over Time (monthly aggregation)
      const costTrends = await ctx.db
        .select({
          projectId: costs.projectId,
          projectName: projects.name,
          month: sql<string>`TO_CHAR(${costs.date}, 'YYYY-MM')`,
          total: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
          count: sql<number>`CAST(COUNT(${costs.id}) AS INTEGER)`,
        })
        .from(costs)
        .leftJoin(projects, eq(costs.projectId, projects.id))
        .where(
          and(
            inArray(costs.projectId, filteredProjectIds),
            isNull(costs.deletedAt),
            dateRangeFilter
          )
        )
        .groupBy(costs.projectId, projects.name, sql`TO_CHAR(${costs.date}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${costs.date}, 'YYYY-MM')`)

      // 6. Most Common Categories (aggregated across all projects)
      const commonCategories = await ctx.db
        .select({
          categoryId: costs.categoryId,
          categoryName: categories.displayName,
          total: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
          count: sql<number>`CAST(COUNT(${costs.id}) AS INTEGER)`,
          percentage: sql<number>`CAST(
            (SUM(${costs.amount})::float / NULLIF((SELECT SUM(amount) FROM costs WHERE project_id = ANY(ARRAY[${sql.join(
              filteredProjectIds.map((id: string) => sql`${id}`),
              sql`, `
            )}]) AND deleted_at IS NULL), 0)) * 100
            AS NUMERIC(5,2))`,
        })
        .from(costs)
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(
          and(
            inArray(costs.projectId, filteredProjectIds),
            isNull(costs.deletedAt),
            dateRangeFilter
          )
        )
        .groupBy(costs.categoryId, categories.displayName)
        .orderBy(desc(sql`SUM(${costs.amount})`))
        .limit(8)

      // 7. Most Used Vendors (frequency and total spend)
      const topVendors = await ctx.db
        .select({
          vendorId: costs.contactId,
          vendorName: sql<string>`${contacts.firstName} || ' ' || ${contacts.lastName}`,
          company: contacts.company,
          projectCount: sql<number>`CAST(COUNT(DISTINCT ${costs.projectId}) AS INTEGER)`,
          totalSpent: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
          avgPerProject: sql<number>`CAST(SUM(${costs.amount}) / NULLIF(COUNT(DISTINCT ${costs.projectId}), 0) AS INTEGER)`,
          transactionCount: sql<number>`CAST(COUNT(${costs.id}) AS INTEGER)`,
        })
        .from(costs)
        .leftJoin(contacts, eq(costs.contactId, contacts.id))
        .where(
          and(
            inArray(costs.projectId, filteredProjectIds),
            isNotNull(costs.contactId),
            isNull(costs.deletedAt),
            dateRangeFilter
          )
        )
        .groupBy(costs.contactId, contacts.firstName, contacts.lastName, contacts.company)
        .orderBy(desc(sql`SUM(${costs.amount})`))
        .limit(20)

      // Get filtered project details
      const filteredProjects = accessibleProjects.filter((p: (typeof accessibleProjects)[0]) =>
        filteredProjectIds.includes(p.id)
      )

      return {
        summary: {
          totalValue: portfolioTotals[0]?.totalValue ?? 0,
          costCount: portfolioTotals[0]?.costCount ?? 0,
          projectCount: filteredProjects.length,
          avgPerProject:
            filteredProjects.length > 0
              ? Math.round((portfolioTotals[0]?.totalValue ?? 0) / filteredProjects.length)
              : 0,
          averageProjectCost:
            filteredProjects.length > 0
              ? Math.round((portfolioTotals[0]?.totalValue ?? 0) / filteredProjects.length)
              : 0,
          totalCosts: portfolioTotals[0]?.totalValue ?? 0,
        },
        projects: filteredProjects,
        costPerSqft: costPerSqft.filter((p: (typeof costPerSqft)[0]) => p.costPerSqft !== null),
        categorySpendByProject,
        projectDurations: projectDurations.filter(
          (p: (typeof projectDurations)[0]) => p.durationDays !== null
        ),
        costTrends,
        commonCategories,
        topVendors,
      }
    }),

  /**
   * Export portfolio data to CSV format
   * Returns CSV string for download
   */
  exportPortfolioData: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()).min(1),
        format: z.enum(["csv"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        })
      }

      // Verify access (same RBAC check as getPortfolioAnalytics)
      const accessibleProjects = await ctx.db
        .selectDistinct({
          id: projects.id,
          name: projects.name,
        })
        .from(projects)
        .leftJoin(projectAccess, eq(projectAccess.projectId, projects.id))
        .where(
          and(
            inArray(projects.id, input.projectIds),
            isNull(projects.deletedAt),
            or(
              eq(projects.ownerId, userId),
              and(eq(projectAccess.userId, userId), isNotNull(projectAccess.acceptedAt))
            )
          )
        )

      if (accessibleProjects.length !== input.projectIds.length) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to one or more selected projects",
        })
      }

      // Get project-level aggregates and category breakdowns
      // Query 1: Get project totals
      const projectTotals = await ctx.db
        .select({
          projectId: projects.id,
          projectName: projects.name,
          projectStatus: projects.status,
          totalCost: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS INTEGER)`,
          durationDays: sql<number>`CAST(COALESCE(EXTRACT(DAY FROM ${projects.endDate} - ${projects.startDate}), 0) AS INTEGER)`,
          costPerSqft: sql<number | null>`
            CASE
              WHEN ${projects.size} IS NOT NULL AND ${projects.size} > 0
              THEN CAST(SUM(${costs.amount}) / ${projects.size} AS INTEGER)
              ELSE NULL
            END
          `,
        })
        .from(projects)
        .leftJoin(costs, and(eq(costs.projectId, projects.id), isNull(costs.deletedAt)))
        .where(and(inArray(projects.id, input.projectIds), isNull(projects.deletedAt)))
        .groupBy(
          projects.id,
          projects.name,
          projects.status,
          projects.startDate,
          projects.endDate,
          projects.size
        )
        .orderBy(projects.name)

      // Query 2: Get category breakdowns by project
      const categoryBreakdowns = await ctx.db
        .select({
          projectId: costs.projectId,
          categoryName: categories.displayName,
          categoryTotal: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
        })
        .from(costs)
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(and(inArray(costs.projectId, input.projectIds), isNull(costs.deletedAt)))
        .groupBy(costs.projectId, categories.displayName)
        .orderBy(costs.projectId, categories.displayName)

      // Build lookup map for categories by project
      const categoriesByProject = new Map<
        string,
        Array<{ categoryName: string | null; categoryTotal: number }>
      >()
      for (const cat of categoryBreakdowns) {
        if (!categoriesByProject.has(cat.projectId)) {
          categoriesByProject.set(cat.projectId, [])
        }
        categoriesByProject.get(cat.projectId)!.push({
          categoryName: cat.categoryName,
          categoryTotal: cat.categoryTotal,
        })
      }

      // Format as CSV per story spec
      const escapeCSV = (value: string | null | undefined): string => {
        if (!value) return ""
        const str = String(value)
        // Escape formula injection
        if (/^[=+\-@]/.test(str)) {
          return `"'${str.replace(/"/g, '""')}"`
        }
        // Escape quotes and wrap if contains comma/newline
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const formatCurrency = (cents: number): string => {
        return `$${(cents / 100).toFixed(2)}`
      }

      const csvRows = [
        [
          "Project Name",
          "Status",
          "Total Cost",
          "Duration (Days)",
          "Cost/m²",
          "Category",
          "Amount",
        ],
        ...projectTotals.flatMap(
          (project: {
            projectId: string
            projectName: string
            projectStatus: string
            totalCost: number
            durationDays: number
            costPerSqft: number | null
          }) => {
            const categories = categoriesByProject.get(project.projectId) || []
            // If project has no categories, still show project row with empty category
            if (categories.length === 0) {
              return [
                [
                  escapeCSV(project.projectName),
                  escapeCSV(project.projectStatus),
                  formatCurrency(project.totalCost),
                  project.durationDays.toString(),
                  project.costPerSqft !== null ? formatCurrency(project.costPerSqft) : "N/A",
                  "",
                  "$0.00",
                ],
              ]
            }
            // One row per category
            return categories.map((cat) => [
              escapeCSV(project.projectName),
              escapeCSV(project.projectStatus),
              formatCurrency(project.totalCost),
              project.durationDays.toString(),
              project.costPerSqft !== null ? formatCurrency(project.costPerSqft) : "N/A",
              escapeCSV(cat.categoryName),
              formatCurrency(cat.categoryTotal),
            ])
          }
        ),
      ]

      const csvContent = csvRows.map((row) => row.join(",")).join("\n")

      return {
        content: csvContent,
        filename: `portfolio-analytics-${new Date().toISOString().split("T")[0]}.csv`,
      }
    }),
})
