/**
 * Notification router for in-app notification system
 * Story 8.1: In-App Notification System
 *
 * Provides endpoints for:
 * - Listing notifications with pagination
 * - Marking notifications as read
 * - Getting unread count for badge display
 */

import { eq, and, desc, sql } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { notifications } from "@/server/db/schema/notifications"
import { projects } from "@/server/db/schema/projects"
import {
  listNotificationsSchema,
  markNotificationAsReadSchema,
  markAllAsReadSchema,
} from "@/lib/validations/notification"

export const notificationRouter = createTRPCRouter({
  /**
   * List notifications for the current user
   *
   * Returns notifications ordered by created date (newest first)
   * Supports:
   * - Pagination with limit/offset
   * - Filtering by unread status
   * - Filtering by project
   *
   * AC #7: List query with pagination
   */
  list: protectedProcedure.input(listNotificationsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Build where conditions
    const conditions = [eq(notifications.userId, userId)]

    if (input.unreadOnly) {
      conditions.push(eq(notifications.read, false))
    }

    if (input.projectId) {
      conditions.push(eq(notifications.projectId, input.projectId))
    }

    // Fetch notifications with pagination
    const results = await ctx.db
      .select({
        notification: notifications,
        project: projects,
      })
      .from(notifications)
      .leftJoin(projects, eq(notifications.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(input.limit)
      .offset(input.offset)

    return results.map(
      ({
        notification,
        project,
      }: {
        notification: typeof notifications.$inferSelect
        project: typeof projects.$inferSelect | null
      }) => ({
        ...notification,
        project: project
          ? {
              id: project.id,
              name: project.name,
            }
          : null,
      })
    )
  }),

  /**
   * Get count of unread notifications for badge display
   *
   * AC #4: Badge displays count of unread notifications
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const result = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))

    return result[0]?.count ?? 0
  }),

  /**
   * Mark a single notification as read
   *
   * AC #8: markAsRead mutation
   */
  markAsRead: protectedProcedure
    .input(markNotificationAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Update only if notification belongs to current user
      const [updated] = await ctx.db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, userId)))
        .returning()

      return { success: !!updated }
    }),

  /**
   * Mark all notifications as read for current user
   *
   * Optionally scoped to a specific project
   * AC #13: markAllAsRead mutation
   */
  markAllAsRead: protectedProcedure.input(markAllAsReadSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    const conditions = [eq(notifications.userId, userId), eq(notifications.read, false)]

    if (input.projectId) {
      conditions.push(eq(notifications.projectId, input.projectId))
    }

    const updated = await ctx.db
      .update(notifications)
      .set({ read: true })
      .where(and(...conditions))
      .returning()

    return { count: updated.length }
  }),
})
