import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"

/**
 * Get the base URL for auth client
 * Priority: NEXT_PUBLIC_APP_URL > window.location.origin > fallback
 */
function getAuthBaseURL(): string {
  // 1. Check for explicit public env var (allows override)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // 2. Client-side: auto-detect from browser
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // 3. Server-side: use DEPLOY_PRIME_URL or localhost fallback
  return process.env.DEPLOY_PRIME_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [twoFactorClient()],
})

export const { useSession, twoFactor } = authClient
