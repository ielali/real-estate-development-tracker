import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
  },
  trustedOrigins: [process.env.NEXTAUTH_URL || "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute for auth endpoints
  },
})

export type Session = typeof auth.$Infer.Session
