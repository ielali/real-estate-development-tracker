/**
 * Vendor Router
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Provides procedures for:
 * - Vendor performance metrics calculation
 * - Vendor rating CRUD operations
 * - Vendor comparison
 * - Vendor performance dashboard
 * - Vendor report export
 */

import { TRPCError } from "@trpc/server"
import { eq, and, isNull, sql, inArray, desc, isNotNull, or } from "drizzle-orm"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { vendorRatings } from "@/server/db/schema/vendor-ratings"
import { contacts } from "@/server/db/schema/contacts"
import { costs } from "@/server/db/schema/costs"
import { projects } from "@/server/db/schema/projects"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { categories } from "@/server/db/schema/categories"
import type { Database } from "@/server/db"

/**
 * Verify user has access to vendor through their projects
 * User can access vendor if they own or partner on any project that has costs associated with the vendor
 */
async function verifyVendorAccess(db: Database, contactId: string, userId: string): Promise<void> {
  // Get all projects where this vendor has costs
  const vendorProjects = await db
    .select({ projectId: costs.projectId })
    .from(costs)
    .where(and(eq(costs.contactId, contactId), isNull(costs.deletedAt)))
    .groupBy(costs.projectId)

  if (vendorProjects.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Vendor not found or has no associated projects",
    })
  }

  const projectIds = vendorProjects.map((p: { projectId: string }) => p.projectId)

  // Check if user has access to at least one of these projects
  const accessibleProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .leftJoin(
      projectAccess,
      and(
        eq(projectAccess.projectId, projects.id),
        eq(projectAccess.userId, userId),
        isNotNull(projectAccess.acceptedAt),
        isNull(projectAccess.deletedAt)
      )
    )
    .where(
      and(
        inArray(projects.id, projectIds),
        or(
          eq(projects.ownerId, userId), // User owns project
          isNotNull(projectAccess.id) // OR user is accepted partner
        ),
        isNull(projects.deletedAt)
      )
    )

  if (accessibleProjects.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this vendor",
    })
  }
}

/**
 * Verify user owns the rating
 */
async function verifyRatingOwnership(
  db: Database,
  ratingId: string,
  userId: string
): Promise<void> {
  const rating = await db
    .select()
    .from(vendorRatings)
    .where(and(eq(vendorRatings.id, ratingId), isNull(vendorRatings.deletedAt)))
    .limit(1)

  if (!rating[0]) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Rating not found",
    })
  }

  if (rating[0].userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not own this rating",
    })
  }
}

export const vendorRouter = createTRPCRouter({
  /**
   * Get vendor performance metrics
   * Calculates projects, spend, frequency, ratings for a vendor
   */
  getVendorMetrics: protectedProcedure
    .input(z.object({ contactId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify access
      await verifyVendorAccess(ctx.db, input.contactId, ctx.user.id)

      // Calculate metrics using SQL aggregations
      const metricsResult = await ctx.db
        .select({
          totalProjects: sql<number>`CAST(COUNT(DISTINCT ${costs.projectId}) AS INTEGER)`,
          totalSpent: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS BIGINT)`,
          averageCost: sql<number>`CAST(COALESCE(AVG(${costs.amount}), 0) AS BIGINT)`,
          lastUsed: sql<Date | null>`MAX(${costs.date})`,
        })
        .from(costs)
        .where(and(eq(costs.contactId, input.contactId), isNull(costs.deletedAt)))

      const metrics = metricsResult[0]

      // Calculate frequency (projects per year)
      const firstCostResult = await ctx.db
        .select({ date: costs.date })
        .from(costs)
        .where(and(eq(costs.contactId, input.contactId), isNull(costs.deletedAt)))
        .orderBy(costs.date)
        .limit(1)

      let frequency = 0
      if (firstCostResult[0] && metrics.totalProjects > 0) {
        const yearsActive =
          (Date.now() - firstCostResult[0].date.getTime()) / (1000 * 60 * 60 * 24 * 365)
        frequency = metrics.totalProjects / Math.max(yearsActive, 1)
      }

      // Get top 3 category specializations
      const categorySpecResult = await ctx.db
        .select({
          categoryId: costs.categoryId,
          categoryName: categories.displayName,
          totalSpent: sql<number>`CAST(SUM(${costs.amount}) AS BIGINT)`,
        })
        .from(costs)
        .innerJoin(categories, eq(costs.categoryId, categories.id))
        .where(and(eq(costs.contactId, input.contactId), isNull(costs.deletedAt)))
        .groupBy(costs.categoryId, categories.displayName)
        .orderBy(desc(sql`SUM(${costs.amount})`))
        .limit(3)

      // Get average rating and count
      const ratingResult = await ctx.db
        .select({
          averageRating: sql<number | null>`AVG(${vendorRatings.rating})`,
          ratingCount: sql<number>`CAST(COUNT(${vendorRatings.id}) AS INTEGER)`,
        })
        .from(vendorRatings)
        .where(and(eq(vendorRatings.contactId, input.contactId), isNull(vendorRatings.deletedAt)))

      return {
        contactId: input.contactId,
        totalProjects: metrics.totalProjects || 0,
        totalSpent: Number(metrics.totalSpent) || 0,
        averageCost: Number(metrics.averageCost) || 0,
        frequency: Math.round(frequency * 100) / 100, // Round to 2 decimals
        lastUsed: metrics.lastUsed,
        categorySpecialization: categorySpecResult.map(
          (spec: { categoryId: string; categoryName: string; totalSpent: number }) => ({
            ...spec,
            totalSpent: Number(spec.totalSpent),
          })
        ),
        averageRating: ratingResult[0]?.averageRating
          ? Math.round(ratingResult[0].averageRating * 10) / 10
          : null,
        ratingCount: ratingResult[0]?.ratingCount || 0,
      }
    }),

  /**
   * Get all ratings for a vendor
   */
  getVendorRatings: protectedProcedure
    .input(z.object({ contactId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify access
      await verifyVendorAccess(ctx.db, input.contactId, ctx.user.id)

      const ratings = await ctx.db
        .select({
          id: vendorRatings.id,
          userId: vendorRatings.userId,
          contactId: vendorRatings.contactId,
          projectId: vendorRatings.projectId,
          projectName: projects.name,
          rating: vendorRatings.rating,
          review: vendorRatings.review,
          createdAt: vendorRatings.createdAt,
          updatedAt: vendorRatings.updatedAt,
        })
        .from(vendorRatings)
        .innerJoin(projects, eq(vendorRatings.projectId, projects.id))
        .where(and(eq(vendorRatings.contactId, input.contactId), isNull(vendorRatings.deletedAt)))
        .orderBy(desc(vendorRatings.createdAt))

      return ratings
    }),

  /**
   * Create a vendor rating
   * One rating per user per vendor per project
   */
  createVendorRating: protectedProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        projectId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        review: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify user has access to project
      const projectResult = await ctx.db
        .select({ id: projects.id })
        .from(projects)
        .leftJoin(
          projectAccess,
          and(
            eq(projectAccess.projectId, projects.id),
            eq(projectAccess.userId, ctx.user.id),
            isNotNull(projectAccess.acceptedAt),
            isNull(projectAccess.deletedAt)
          )
        )
        .where(
          and(
            eq(projects.id, input.projectId),
            or(
              eq(projects.ownerId, ctx.user.id), // User owns project
              isNotNull(projectAccess.id) // OR user is partner
            ),
            isNull(projects.deletedAt)
          )
        )
        .limit(1)

      if (!projectResult[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or you do not have access",
        })
      }

      // Verify vendor is associated with project through costs
      const vendorCost = await ctx.db
        .select()
        .from(costs)
        .where(
          and(
            eq(costs.contactId, input.contactId),
            eq(costs.projectId, input.projectId),
            isNull(costs.deletedAt)
          )
        )
        .limit(1)

      if (!vendorCost[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vendor is not associated with this project",
        })
      }

      // Check for existing rating
      const existingRating = await ctx.db
        .select()
        .from(vendorRatings)
        .where(
          and(
            eq(vendorRatings.userId, ctx.user.id),
            eq(vendorRatings.contactId, input.contactId),
            eq(vendorRatings.projectId, input.projectId),
            isNull(vendorRatings.deletedAt)
          )
        )
        .limit(1)

      if (existingRating[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already rated this vendor for this project",
        })
      }

      // Create rating
      const newRating = await ctx.db
        .insert(vendorRatings)
        .values({
          userId: ctx.user.id,
          contactId: input.contactId,
          projectId: input.projectId,
          rating: input.rating,
          review: input.review ?? null,
        })
        .returning()

      return newRating[0]
    }),

  /**
   * Update a vendor rating
   * User can only update their own ratings
   */
  updateVendorRating: protectedProcedure
    .input(
      z.object({
        ratingId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        review: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify ownership
      await verifyRatingOwnership(ctx.db, input.ratingId, ctx.user.id)

      // Update rating
      const updatedRating = await ctx.db
        .update(vendorRatings)
        .set({
          rating: input.rating,
          review: input.review ?? null,
          updatedAt: new Date(),
        })
        .where(eq(vendorRatings.id, input.ratingId))
        .returning()

      return updatedRating[0]
    }),

  /**
   * Delete a vendor rating (soft delete)
   * User can only delete their own ratings
   */
  deleteVendorRating: protectedProcedure
    .input(z.object({ ratingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify ownership
      await verifyRatingOwnership(ctx.db, input.ratingId, ctx.user.id)

      // Soft delete
      await ctx.db
        .update(vendorRatings)
        .set({ deletedAt: new Date() })
        .where(eq(vendorRatings.id, input.ratingId))

      return { success: true }
    }),

  /**
   * Compare multiple vendors side-by-side
   * Max 5 vendors at a time
   */
  compareVendors: protectedProcedure
    .input(
      z.object({
        contactIds: z.array(z.string().uuid()).min(1).max(5),
        filters: z
          .object({
            categoryId: z.string().uuid().optional(),
            minRating: z.number().min(1).max(5).optional(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
      // Verify access to all vendors
      for (const contactId of input.contactIds) {
        await verifyVendorAccess(ctx.db, contactId, ctx.user.id)
      }

      // Fetch metrics for all vendors in parallel
      const vendorMetrics = await Promise.all(
        input.contactIds.map(async (contactId) => {
          // Get vendor details
          const vendor = await ctx.db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contactId))
            .limit(1)

          // Calculate metrics
          const metricsResult = await ctx.db
            .select({
              totalProjects: sql<number>`CAST(COUNT(DISTINCT ${costs.projectId}) AS INTEGER)`,
              totalSpent: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS BIGINT)`,
              lastUsed: sql<Date | null>`MAX(${costs.date})`,
            })
            .from(costs)
            .where(and(eq(costs.contactId, contactId), isNull(costs.deletedAt)))

          const metrics = metricsResult[0]

          // Calculate frequency
          const firstCostResult = await ctx.db
            .select({ date: costs.date })
            .from(costs)
            .where(and(eq(costs.contactId, contactId), isNull(costs.deletedAt)))
            .orderBy(costs.date)
            .limit(1)

          let frequency = 0
          if (firstCostResult[0] && metrics.totalProjects > 0) {
            const yearsActive =
              (Date.now() - firstCostResult[0].date.getTime()) / (1000 * 60 * 60 * 24 * 365)
            frequency = metrics.totalProjects / Math.max(yearsActive, 1)
          }

          // Get rating stats
          const ratingResult = await ctx.db
            .select({
              averageRating: sql<number | null>`AVG(${vendorRatings.rating})`,
              ratingCount: sql<number>`CAST(COUNT(${vendorRatings.id}) AS INTEGER)`,
            })
            .from(vendorRatings)
            .where(and(eq(vendorRatings.contactId, contactId), isNull(vendorRatings.deletedAt)))

          return {
            vendor: vendor[0],
            totalProjects: metrics.totalProjects || 0,
            totalSpent: Number(metrics.totalSpent) || 0,
            frequency: Math.round(frequency * 100) / 100,
            lastUsed: metrics.lastUsed,
            averageRating: ratingResult[0]?.averageRating
              ? Math.round(ratingResult[0].averageRating * 10) / 10
              : null,
            ratingCount: ratingResult[0]?.ratingCount || 0,
          }
        })
      )

      // Apply filters
      let filtered = vendorMetrics

      if (input.filters?.minRating) {
        filtered = filtered.filter(
          (v) => v.averageRating !== null && v.averageRating >= input.filters!.minRating!
        )
      }

      if (input.filters?.categoryId) {
        // Filter vendors who have worked in this category
        const vendorsInCategory = await ctx.db
          .select({ contactId: costs.contactId })
          .from(costs)
          .where(
            and(
              inArray(costs.contactId, input.contactIds),
              eq(costs.categoryId, input.filters.categoryId),
              isNull(costs.deletedAt)
            )
          )
          .groupBy(costs.contactId)

        const categoryVendorIds = vendorsInCategory.map((v: { contactId: string }) => v.contactId)
        filtered = filtered.filter((v) => categoryVendorIds.includes(v.vendor.id))
      }

      return filtered
    }),

  /**
   * Get vendor performance dashboard data
   * Includes top-rated, most-used, underutilized vendors, and spend distribution
   */
  getVendorPerformanceDashboard: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" })
    // Get all vendors user has access to (through their projects)
    const userProjects = await ctx.db
      .select({ id: projects.id })
      .from(projects)
      .leftJoin(
        projectAccess,
        and(
          eq(projectAccess.projectId, projects.id),
          eq(projectAccess.userId, ctx.user.id),
          isNotNull(projectAccess.acceptedAt),
          isNull(projectAccess.deletedAt)
        )
      )
      .where(
        and(
          or(
            eq(projects.ownerId, ctx.user.id), // User owns project
            isNotNull(projectAccess.id) // OR user is partner
          ),
          isNull(projects.deletedAt)
        )
      )

    const projectIds = userProjects.map((p: { id: string }) => p.id)

    if (projectIds.length === 0) {
      return {
        topRatedVendors: [],
        mostUsedVendors: [],
        underutilizedVendors: [],
        recentVendors: [],
        vendorSpendDistribution: [],
      }
    }

    // Get all vendors from user's projects
    const vendors = await ctx.db
      .select({ contactId: costs.contactId })
      .from(costs)
      .where(and(inArray(costs.projectId, projectIds), isNull(costs.deletedAt)))
      .groupBy(costs.contactId)

    const vendorIds = vendors.map((v: { contactId: string }) => v.contactId)

    if (vendorIds.length === 0) {
      return {
        topRatedVendors: [],
        mostUsedVendors: [],
        underutilizedVendors: [],
        recentVendors: [],
        vendorSpendDistribution: [],
      }
    }

    // Calculate vendor metrics for dashboard
    // This is a simplified version - for production, consider caching
    const vendorMetrics = await Promise.all(
      vendorIds.map(async (contactId: string) => {
        const vendor = await ctx.db
          .select()
          .from(contacts)
          .where(eq(contacts.id, contactId))
          .limit(1)

        const metricsResult = await ctx.db
          .select({
            totalProjects: sql<number>`CAST(COUNT(DISTINCT ${costs.projectId}) AS INTEGER)`,
            totalSpent: sql<number>`CAST(COALESCE(SUM(${costs.amount}), 0) AS BIGINT)`,
            lastUsed: sql<Date | null>`MAX(${costs.date})`,
          })
          .from(costs)
          .where(
            and(
              eq(costs.contactId, contactId),
              inArray(costs.projectId, projectIds),
              isNull(costs.deletedAt)
            )
          )

        const metrics = metricsResult[0]

        // Calculate frequency
        const firstCostResult = await ctx.db
          .select({ date: costs.date })
          .from(costs)
          .where(
            and(
              eq(costs.contactId, contactId),
              inArray(costs.projectId, projectIds),
              isNull(costs.deletedAt)
            )
          )
          .orderBy(costs.date)
          .limit(1)

        let frequency = 0
        if (firstCostResult[0] && metrics.totalProjects > 0) {
          const yearsActive =
            (Date.now() - firstCostResult[0].date.getTime()) / (1000 * 60 * 60 * 24 * 365)
          frequency = metrics.totalProjects / Math.max(yearsActive, 1)
        }

        // Get rating stats
        const ratingResult = await ctx.db
          .select({
            averageRating: sql<number | null>`AVG(${vendorRatings.rating})`,
            ratingCount: sql<number>`CAST(COUNT(${vendorRatings.id}) AS INTEGER)`,
          })
          .from(vendorRatings)
          .where(and(eq(vendorRatings.contactId, contactId), isNull(vendorRatings.deletedAt)))

        return {
          vendor: vendor[0],
          totalProjects: metrics.totalProjects || 0,
          totalSpent: Number(metrics.totalSpent) || 0,
          frequency: Math.round(frequency * 100) / 100,
          lastUsed: metrics.lastUsed,
          averageRating: ratingResult[0]?.averageRating
            ? Math.round(ratingResult[0].averageRating * 10) / 10
            : null,
          ratingCount: ratingResult[0]?.ratingCount || 0,
        }
      })
    )

    // Top-rated vendors (avgRating >= 4.0, limit 10)
    const topRatedVendors = vendorMetrics
      .filter((v) => v.averageRating !== null && v.averageRating >= 4.0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10)

    // Most-used vendors (by project count, limit 10)
    const mostUsedVendors = vendorMetrics
      .sort((a, b) => b.totalProjects - a.totalProjects)
      .slice(0, 10)

    // Underutilized vendors (high rating but low frequency)
    const underutilizedVendors = vendorMetrics
      .filter((v) => v.averageRating !== null && v.averageRating >= 4.0 && v.frequency < 1)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10)

    // Recent vendors (last 10 vendors used with ratings)
    const recentVendors = vendorMetrics
      .filter((v) => v.lastUsed !== null)
      .sort((a, b) => {
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 10)

    // Vendor spend distribution (top 10, group rest as "Other")
    const sortedBySpend = [...vendorMetrics].sort((a, b) => b.totalSpent - a.totalSpent)
    const top10Spend = sortedBySpend.slice(0, 10)
    const otherSpend = sortedBySpend.slice(10).reduce((sum, v) => sum + v.totalSpent, 0)

    const vendorSpendDistribution = top10Spend.map((v) => ({
      name: `${v.vendor.firstName} ${v.vendor.lastName}`.trim() || v.vendor.company || "Unknown",
      value: v.totalSpent,
    }))

    if (otherSpend > 0) {
      vendorSpendDistribution.push({
        name: "Other",
        value: otherSpend,
      })
    }

    return {
      topRatedVendors,
      mostUsedVendors,
      underutilizedVendors,
      recentVendors,
      vendorSpendDistribution,
    }
  }),
})
