import { z } from "zod"
import bcrypt from "bcryptjs"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { users, accounts } from "@/server/db/schema"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

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
})
