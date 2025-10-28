/**
 * Partner Dashboard tRPC Router (Story 4.3)
 *
 * Provides read-only data endpoints for partner dashboard view.
 * All queries use verifyProjectAccess() to ensure partners can only
 * access projects they've been invited to and accepted.
 *
 * Queries:
 * - getProjectSummary: Project with key metrics (total spent, document count, activity)
 * - getCostBreakdown: Cost totals grouped by category with percentages
 * - getRecentActivity: Timeline of audit log entries
 * - getDocumentGallery: Documents grouped by category with signed URLs
 */

import { z } from "zod"
import { eq, and, isNull, gte, desc, sql, count } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { verifyProjectAccess } from "../helpers/authorization"
import { costs } from "@/server/db/schema/costs"
import { documents } from "@/server/db/schema/documents"
import { categories } from "@/server/db/schema/categories"
import { auditLog } from "@/server/db/schema/auditLog"
import { users } from "@/server/db/schema/users"

export const partnerDashboardRouter = createTRPCRouter({
  /**
   * Get project summary with key metrics
   *
   * Returns project information with:
   * - Total spent by category (cost breakdown)
   * - Recent activity count from audit logs (last 30 days)
   * - Document count by category
   * - Project status and timeline info
   *
   * Access: Read permission required
   */
  getProjectSummary: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify access (throws if no access)
      const { project } = await verifyProjectAccess(ctx, input.projectId, "read")

      // Get total spent and cost breakdown by category
      const costBreakdown = await ctx.db
        .select({
          categoryId: costs.categoryId,
          categoryName: categories.displayName,
          total: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
        })
        .from(costs)
        .innerJoin(categories, eq(costs.categoryId, categories.id))
        .where(and(eq(costs.projectId, input.projectId), isNull(costs.deletedAt)))
        .groupBy(costs.categoryId, categories.displayName)

      // Calculate total spent across all categories
      const totalSpent = costBreakdown.reduce(
        (sum: number, item: { total: number | null }) => sum + (item.total || 0),
        0
      )

      // Count documents
      const documentCountResult = await ctx.db
        .select({
          count: count(),
        })
        .from(documents)
        .where(and(eq(documents.projectId, input.projectId), isNull(documents.deletedAt)))

      const documentCount = documentCountResult[0]?.count || 0

      // Count recent activity (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentActivityResult = await ctx.db
        .select({
          count: count(),
        })
        .from(auditLog)
        .where(and(eq(auditLog.projectId, input.projectId), gte(auditLog.createdAt, thirtyDaysAgo)))

      const recentActivityCount = recentActivityResult[0]?.count || 0

      return {
        project,
        totalSpent,
        costBreakdown,
        documentCount,
        recentActivityCount,
      }
    }),

  /**
   * Get cost breakdown for visualization
   *
   * Returns costs grouped by category with:
   * - Category display name
   * - Total amount spent
   * - Percentage of total spend
   *
   * Access: Read permission required
   */
  getCostBreakdown: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify access (throws if no access)
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Get costs grouped by category
      const categoryTotals = await ctx.db
        .select({
          categoryId: costs.categoryId,
          categoryName: categories.displayName,
          total: sql<number>`CAST(SUM(${costs.amount}) AS INTEGER)`,
        })
        .from(costs)
        .innerJoin(categories, eq(costs.categoryId, categories.id))
        .where(and(eq(costs.projectId, input.projectId), isNull(costs.deletedAt)))
        .groupBy(costs.categoryId, categories.displayName)

      // Calculate total for percentages
      const grandTotal = categoryTotals.reduce(
        (sum: number, item: { total: number | null }) => sum + (item.total || 0),
        0
      )

      // Add percentage to each category
      const breakdown = categoryTotals.map(
        (item: { categoryId: string; categoryName: string; total: number | null }) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          total: item.total || 0,
          percentage: grandTotal > 0 ? ((item.total || 0) / grandTotal) * 100 : 0,
        })
      )

      return {
        breakdown,
        grandTotal,
      }
    }),

  /**
   * Get recent activity for timeline view
   *
   * Returns audit log entries with:
   * - User names
   * - Formatted timestamps
   * - Action descriptions
   * - Paginated results (default 20, max 50)
   *
   * Access: Read permission required
   */
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access (throws if no access)
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Fetch audit logs with user information
      const activities = await ctx.db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          changes: auditLog.changes,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(auditLog)
        .innerJoin(users, eq(auditLog.userId, users.id))
        .where(eq(auditLog.projectId, input.projectId))
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      // Get total count for pagination
      const totalCountResult = await ctx.db
        .select({ count: count() })
        .from(auditLog)
        .where(eq(auditLog.projectId, input.projectId))

      const totalCount = totalCountResult[0]?.count || 0

      return {
        activities,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      }
    }),

  /**
   * Get document gallery for viewing
   *
   * Returns documents grouped by category with:
   * - File metadata (name, size, upload date, category)
   * - Signed URLs for secure document access
   * - Thumbnail URLs for images
   *
   * Access: Read permission required
   */
  getDocumentGallery: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify access (throws if no access)
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Fetch documents with category information
      const docs = await ctx.db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          blobUrl: documents.blobUrl,
          thumbnailUrl: documents.thumbnailUrl,
          createdAt: documents.createdAt,
          categoryId: documents.categoryId,
          categoryName: categories.displayName,
        })
        .from(documents)
        .innerJoin(categories, eq(documents.categoryId, categories.id))
        .where(and(eq(documents.projectId, input.projectId), isNull(documents.deletedAt)))
        .orderBy(desc(documents.createdAt))

      // Group documents by category
      const groupedByCategory: Record<
        string,
        Array<{
          id: string
          fileName: string
          fileSize: number
          mimeType: string
          blobUrl: string
          thumbnailUrl: string | null
          createdAt: Date
        }>
      > = {}

      docs.forEach(
        (doc: {
          id: string
          fileName: string
          fileSize: number
          mimeType: string
          blobUrl: string
          thumbnailUrl: string | null
          createdAt: Date
          categoryName: string | null
        }) => {
          const categoryName = doc.categoryName || "Uncategorized"
          if (!groupedByCategory[categoryName]) {
            groupedByCategory[categoryName] = []
          }
          groupedByCategory[categoryName].push({
            id: doc.id,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            blobUrl: doc.blobUrl,
            thumbnailUrl: doc.thumbnailUrl,
            createdAt: doc.createdAt,
          })
        }
      )

      return {
        documents: groupedByCategory,
        totalCount: docs.length,
      }
    }),
})
