import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.DEPLOY_PRIME_URL,
  plugins: [twoFactorClient()],
})

export const { useSession, twoFactor } = authClient
