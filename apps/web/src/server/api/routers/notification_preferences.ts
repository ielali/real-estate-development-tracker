import { z } from "zod"
import { eq } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"

/**
 * Notification Preferences Router
 * Manages user preferences for email notifications
 */
export const notificationPreferencesRouter = createTRPCRouter({
  /**
   * Get user's notification preferences
   * Creates default preferences if none exist
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Query existing preferences
    let preferences = await ctx.db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })

    // Create default preferences if none exist
    if (!preferences) {
      const [newPreferences] = await ctx.db
        .insert(notificationPreferences)
        .values({
          userId,
          emailOnCost: true,
          emailOnLargeExpense: true,
          emailOnDocument: true,
          emailOnTimeline: true,
          emailOnComment: true,
          emailDigestFrequency: "immediate",
          timezone: "Australia/Sydney",
        })
        .returning()

      preferences = newPreferences
    }

    return preferences
  }),

  /**
   * Update user's notification preferences
   * Uses upsert pattern (insert if not exists, update if exists)
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailOnCost: z.boolean().optional(),
        emailOnLargeExpense: z.boolean().optional(),
        emailOnDocument: z.boolean().optional(),
        emailOnTimeline: z.boolean().optional(),
        emailOnComment: z.boolean().optional(),
        emailDigestFrequency: z.enum(["immediate", "daily", "weekly", "never"]).optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Validate at least one field provided
      if (Object.keys(input).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one preference field must be provided",
        })
      }

      // Upsert pattern (insert or update)
      const [updated] = await ctx.db
        .insert(notificationPreferences)
        .values({
          userId,
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            ...input,
            updatedAt: new Date(),
          },
        })
        .returning()

      return updated
    }),
})
