import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { users } from "@/server/db/schema"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

/**
 * Users router - User profile management
 *
 * Handles user profile updates and account information
 */
export const usersRouter = createTRPCRouter({
  /**
   * Update user profile (firstName, lastName)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Must be logged in to update profile",
        })
      }
      const userId = ctx.user.id

      // Generate full name from first and last name
      const fullName = `${input.firstName} ${input.lastName}`

      try {
        const [updatedUser] = await ctx.db
          .update(users)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            name: fullName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning()

        if (!updatedUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          })
        }

        return {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          name: updatedUser.name,
          email: updatedUser.email,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        })
      }
    }),

  /**
   * Get current user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Must be logged in to get profile",
      })
    }
    const userId = ctx.user.id

    const [user] = await ctx.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role,
        twoFactorEnabled: users.twoFactorEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    return user
  }),
})
