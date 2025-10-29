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
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { verifyProjectAccess } from "../helpers/authorization"
import { costs } from "@/server/db/schema/costs"
import { documents } from "@/server/db/schema/documents"
import { categories } from "@/server/db/schema/categories"
import { auditLog } from "@/server/db/schema/auditLog"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"

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
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Fetch project with address relation
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          address: true,
        },
      })

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

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
   * - Secure API URLs for document access (no raw blob URLs)
   * - Pagination support for large document sets
   *
   * Access: Read permission required
   */
  getDocumentGallery: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access (throws if no access)
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Get total count first
      const totalCountResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(and(eq(documents.projectId, input.projectId), isNull(documents.deletedAt)))

      const totalCount = Number(totalCountResult[0]?.count || 0)

      // Fetch paginated documents with category information and uploader details
      // Note: Blob URLs are not fetched for security - documents are served via API routes
      const docs = await ctx.db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          uploadedAt: documents.createdAt,
          categoryId: documents.categoryId,
          categoryName: categories.displayName,
          uploadedById: documents.uploadedById,
          uploaderFirstName: users.firstName,
          uploaderLastName: users.lastName,
        })
        .from(documents)
        .innerJoin(categories, eq(documents.categoryId, categories.id))
        .innerJoin(users, eq(documents.uploadedById, users.id))
        .where(and(eq(documents.projectId, input.projectId), isNull(documents.deletedAt)))
        .orderBy(desc(documents.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      // Format documents with uploader name
      // Note: blobUrl and thumbnailUrl are NOT returned for security
      // Frontend should use /api/documents/[id]/view and /api/documents/[id]/thumbnail
      const formattedDocs = docs.map(
        (doc: {
          id: string
          fileName: string
          fileSize: number
          mimeType: string
          uploadedAt: Date
          categoryId: string
          categoryName: string | null
          uploadedById: string
          uploaderFirstName: string
          uploaderLastName: string | null
        }) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          categoryName: doc.categoryName || "Uncategorized",
          uploadedBy: `${doc.uploaderFirstName} ${doc.uploaderLastName || ""}`.trim(),
          uploadedAt: doc.uploadedAt,
          // Thumbnail URLs are provided via secure API route
          thumbnailUrl: `/api/documents/${doc.id}/thumbnail`,
          // Document view URL via secure API route
          viewUrl: `/api/documents/${doc.id}/view`,
        })
      )

      return {
        documents: formattedDocs,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      }
    }),
})
