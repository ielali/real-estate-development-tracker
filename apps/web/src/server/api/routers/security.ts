/**
 * Security tRPC Router
 *
 * Story 6.3: Endpoints for security activity log and 2FA adoption stats
 *
 * Endpoints:
 * - getActivityLog - Get user's security event history (last 50 events)
 * - get2FAAdoptionStats - Get 2FA adoption percentage (admin only)
 */

import { createTRPCRouter, protectedProcedure } from "../trpc"
import { securityEventLogger } from "@/server/services/security-event-logger"
import { users } from "@/server/db/schema/users"
import { isNull, eq, sql } from "drizzle-orm"
import { requireAdmin } from "../helpers/authorization"
import { TRPCError } from "@trpc/server"

export const securityRouter = createTRPCRouter({
  /**
   * Get activity log for current user
   * Returns last 50 security events ordered by timestamp DESC
   */
  getActivityLog: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to view activity log",
      })
    }

    const events = await securityEventLogger.getUserEvents(ctx.user.id, 50)

    return events.map((event: (typeof events)[0]) => ({
      id: event.id,
      eventType: event.eventType,
      timestamp: event.timestamp,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
    }))
  }),

  /**
   * Get 2FA adoption statistics (admin only)
   * Returns total users, users with 2FA enabled, and adoption percentage
   */
  get2FAAdoptionStats: protectedProcedure.query(async ({ ctx }) => {
    // Require admin role
    requireAdmin(ctx)

    // Get total non-deleted users
    const totalUsersResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt))

    // Get users with 2FA enabled
    const usersWithTwoFactorResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${isNull(users.deletedAt)} AND ${eq(users.twoFactorEnabled, true)}`)

    const total = totalUsersResult[0]?.count || 0
    const with2FA = usersWithTwoFactorResult[0]?.count || 0
    const percentage = total > 0 ? Math.round((with2FA / total) * 100) : 0

    return {
      totalUsers: total,
      usersWithTwoFactor: with2FA,
      adoptionPercentage: percentage,
    }
  }),
})
