import { z } from "zod"
import { eq } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"
import { verifyUnsubscribeToken, revokeToken } from "@/server/utils/jwt"

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

  /**
   * Verify an unsubscribe token and return the user ID
   * Public endpoint (no auth required) for unsubscribe links
   */
  verifyUnsubscribeToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const userId = await verifyUnsubscribeToken(input.token)
        return { userId }
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error instanceof Error ? error.message : "Invalid or expired unsubscribe link",
        })
      }
    }),

  /**
   * Unsubscribe from emails using unsubscribe token
   * QA Fix: Revokes token after successful unsubscribe
   * Public endpoint (no auth required) for one-click unsubscribe
   */
  unsubscribeWithToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the token and get user ID
        const userId = await verifyUnsubscribeToken(input.token)

        // Update preferences to disable all emails
        const [updated] = await ctx.db
          .insert(notificationPreferences)
          .values({
            userId,
            emailDigestFrequency: "never",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: notificationPreferences.userId,
            set: {
              emailDigestFrequency: "never",
              updatedAt: new Date(),
            },
          })
          .returning()

        // Revoke the token to prevent reuse
        try {
          await revokeToken(input.token, "User unsubscribed from emails")
        } catch (revokeError) {
          // Log but don't fail the unsubscribe if revocation fails
          console.error("Failed to revoke token after unsubscribe:", revokeError)
        }

        return { success: true, preferences: updated }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to unsubscribe",
        })
      }
    }),
})
