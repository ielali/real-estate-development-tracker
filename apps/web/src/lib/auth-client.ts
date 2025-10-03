import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.DEPLOY_PRIME_URL || "http://localhost:3000",
})
