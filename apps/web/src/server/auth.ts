import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"
import { users, sessions, accounts, verifications } from "./db/schema"
import { emailService } from "../lib/email"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url: _url, token }) => {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      const resetUrl = `${baseUrl}/reset-password?token=${token}`

      await emailService.sendPasswordResetEmail({
        user: {
          email: user.email,
          name: user.name,
        },
        resetUrl,
        token,
      })
    },
    resetPasswordRedirectTo: "/login?message=password-reset-success",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
  },
  trustedOrigins: [process.env.NEXTAUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute for auth endpoints
    storage: "memory", // Use memory storage for rate limiting
  },
})

export type Session = typeof auth.$Infer.Session
