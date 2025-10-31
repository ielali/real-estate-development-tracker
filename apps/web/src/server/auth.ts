import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { twoFactor } from "better-auth/plugins"
import { db } from "./db"
import { users, sessions, accounts, verifications, twoFactor as twoFactorTable } from "./db/schema"
import { emailService } from "../lib/email"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      twoFactor: twoFactorTable,
    },
  }),
  plugins: [
    twoFactor({
      issuer: "Real Estate Development Tracker",
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "partner",
        input: false, // Not user-editable through auth endpoints
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url: _url, token }) => {
      const baseUrl = process.env.DEPLOY_PRIME_URL
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
  trustedOrigins: [process.env.DEPLOY_PRIME_URL || ""],
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  rateLimit: {
    window: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per 5 minutes for auth endpoints (including 2FA verification)
    storage: "memory", // Use memory storage for rate limiting
    // NOTE: This provides server-side rate limiting that cannot be bypassed by page refresh
    // Protects against brute force attacks on 2FA codes (QA SEC-001)
  },
})

export type Session = typeof auth.$Infer.Session
