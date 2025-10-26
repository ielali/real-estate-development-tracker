import { z } from "zod"
import bcrypt from "bcryptjs"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { users, accounts } from "@/server/db/schema"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull } from "drizzle-orm"

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["admin", "partner"]).default("partner"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        })
      }

      const hashedPassword = await bcrypt.hash(input.password, 10)

      const userId = crypto.randomUUID()

      const [newUser] = await ctx.db
        .insert(users)
        .values({
          id: userId,
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          role: input.role,
        })
        .returning()

      // Store password in accounts table for Better Auth compatibility
      await ctx.db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
        updatedAt: new Date(),
      })

      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      }
    }),

  registerWithInvitation: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        password: z.string().min(8),
        invitationToken: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate invitation token exists and not expired
      const invitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(
          and(
            eq(projectAccess.invitationToken, input.invitationToken),
            isNull(projectAccess.deletedAt)
          )
        )
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation link.",
        })
      }

      // Check if expired
      if (invitation[0].expiresAt && new Date() > invitation[0].expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired. Please request a new one.",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        })
      }

      // Check if user already exists with this email
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists. Please log in instead.",
        })
      }

      // Create user account with role='partner'
      const hashedPassword = await bcrypt.hash(input.password, 10)
      const userId = crypto.randomUUID()
      const now = new Date()

      const [newUser] = await ctx.db
        .insert(users)
        .values({
          id: userId,
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          role: "partner",
          emailVerified: true, // Invitation validates email
        })
        .returning()

      // Store password in accounts table for Better Auth compatibility
      await ctx.db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
        updatedAt: now,
      })

      // Link user to project via acceptInvitation logic
      await ctx.db
        .update(projectAccess)
        .set({
          userId,
          acceptedAt: now,
          invitationToken: null, // Clear token after use
          updatedAt: now,
        })
        .where(eq(projectAccess.id, invitation[0].id))

      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        projectId: invitation[0].projectId,
      }
    }),
})
