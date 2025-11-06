import { z } from "zod"
import { eq, and, desc } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { auditLog } from "@/server/db/schema/auditLog"
import { users } from "@/server/db/schema/users"
import { verifyProjectAccess } from "../helpers/authorization"

/**
 * Audit Log router for transparency and security auditing
 *
 * Provides endpoints for viewing access logs and audit trails.
 * Story 4.2 - Role-Based Access Control
 */
export const auditLogRouter = createTRPCRouter({
  /**
   * List access attempts for a specific project
   *
   * Returns log of all project access attempts (successful and failed)
   * with user information, role, permission level, and timestamps.
   *
   * Available to:
   * - Project owners
   * - Partners with accepted access to the project
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User doesn't have access to this project
   * @returns Array of access attempt records with user details
   */
  listAccessAttempts: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { projectId, limit, offset } = input

      // Verify user has access to the project (owner or partner)
      // This ensures users can only view access logs for projects they can access
      await verifyProjectAccess(ctx, projectId, "read")

      // Query audit logs for access attempts on this project
      const logs = await ctx.db
        .select({
          id: auditLog.id,
          timestamp: auditLog.timestamp,
          userId: auditLog.userId,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          metadata: auditLog.metadata,
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
          },
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .where(
          and(
            eq(auditLog.entityId, projectId),
            eq(auditLog.action, "accessed"),
            eq(auditLog.entityType, "project")
          )
        )
        .orderBy(desc(auditLog.timestamp))
        .limit(limit)
        .offset(offset)

      // Parse metadata and format results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accessAttempts = logs.map((log: any) => {
        let metadata: {
          success?: boolean
          permission?: string
          role?: string
          reason?: string
        } = {}

        try {
          if (log.metadata) {
            metadata = JSON.parse(log.metadata)
          }
        } catch (error) {
          console.error("Failed to parse audit log metadata:", error)
        }

        return {
          id: log.id,
          userId: log.userId,
          userName: log.user
            ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email
            : "Unknown User",
          userEmail: log.user?.email || "",
          userRole:
            (metadata.role as "admin" | "partner") ||
            (log.user?.role as "admin" | "partner") ||
            "partner",
          permission: metadata.permission || "unknown",
          timestamp: log.timestamp,
          success: metadata.success ?? true,
          reason: metadata.reason || null,
        }
      })

      // Get total count for pagination
      const countResult = await ctx.db
        .select({ count: auditLog.id })
        .from(auditLog)
        .where(
          and(
            eq(auditLog.entityId, projectId),
            eq(auditLog.action, "accessed"),
            eq(auditLog.entityType, "project")
          )
        )

      return {
        accessAttempts,
        total: countResult.length,
        limit,
        offset,
      }
    }),
})
