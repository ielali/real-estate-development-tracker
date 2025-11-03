/**
 * JWT Utilities
 * Story 8.2: Proper JWT token generation and verification for unsubscribe links
 * QA Fix: Token revocation mechanism
 *
 * Uses jose library for secure JWT operations
 */

import { SignJWT, jwtVerify } from "jose"
import { db } from "@/server/db"
import { revokedTokens } from "@/server/db/schema/revoked_tokens"
import { eq } from "drizzle-orm"
import crypto from "crypto"

const JWT_SECRET = process.env.BETTER_AUTH_SECRET
if (!JWT_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required for JWT operations")
}

const secret = new TextEncoder().encode(JWT_SECRET)

/**
 * JWT token expiry durations
 */
export const TokenExpiry = {
  UNSUBSCRIBE: 90 * 24 * 60 * 60 * 1000, // 90 days (matching notification cleanup period)
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
} as const

/**
 * JWT token purposes
 */
export const TokenPurpose = {
  UNSUBSCRIBE: "unsubscribe",
  PASSWORD_RESET: "password_reset",
  EMAIL_VERIFICATION: "email_verification",
} as const

export type TokenPurposeType = (typeof TokenPurpose)[keyof typeof TokenPurpose]

/**
 * Generate a JWT token with unique JTI for revocation support
 *
 * @param payload - Token payload
 * @param expiresIn - Expiry duration in milliseconds
 * @returns Object with signed JWT token and jti
 */
export async function generateToken(
  payload: {
    userId: string
    purpose: TokenPurposeType
    [key: string]: unknown
  },
  expiresIn: number
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const expiryDate = new Date(Date.now() + expiresIn)

  // Generate unique JWT ID for revocation tracking
  const jti = crypto.randomUUID()

  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiryDate.getTime() / 1000)) // Convert to seconds
    .setIssuer("real-estate-portfolio")
    .setAudience("user")
    .setJti(jti)
    .sign(secret)

  return { token, jti, expiresAt: expiryDate }
}

/**
 * Check if a token has been revoked
 * QA Fix: Token revocation check
 *
 * @param jti - JWT ID to check
 * @returns True if token is revoked
 */
async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    const [revoked] = await db
      .select()
      .from(revokedTokens)
      .where(eq(revokedTokens.jti, jti))
      .limit(1)

    return !!revoked
  } catch (error) {
    console.error("Error checking token revocation:", error)
    // Fail open for availability, but log the error
    return false
  }
}

/**
 * Verify and decode a JWT token with revocation check
 * QA Fix: Added revocation validation
 *
 * @param token - JWT token to verify
 * @param expectedPurpose - Optional expected purpose to validate
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, revoked, or purpose doesn't match
 */
export async function verifyToken<T = Record<string, unknown>>(
  token: string,
  expectedPurpose?: TokenPurposeType
): Promise<T & { userId: string; purpose: TokenPurposeType; jti: string }> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "real-estate-portfolio",
      audience: "user",
    })

    // Validate purpose if specified
    if (expectedPurpose && payload.purpose !== expectedPurpose) {
      throw new Error(`Invalid token purpose. Expected ${expectedPurpose}, got ${payload.purpose}`)
    }

    // Check if token has been revoked
    const jti = payload.jti as string
    if (!jti) {
      throw new Error("Token missing JWT ID")
    }

    if (await isTokenRevoked(jti)) {
      throw new Error("Token has been revoked")
    }

    return payload as T & { userId: string; purpose: TokenPurposeType; jti: string }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific JWT errors
      if (error.message.includes("expired")) {
        throw new Error("Token has expired")
      }
      if (error.message.includes("signature")) {
        throw new Error("Invalid token signature")
      }
      if (error.message.includes("revoked")) {
        throw new Error("Token has been revoked")
      }
      throw error
    }
    throw new Error("Token verification failed")
  }
}

/**
 * Generate an unsubscribe token for email notifications
 * QA Fix: Returns just the token string (maintains API compatibility)
 *
 * @param userId - User ID
 * @returns Unsubscribe JWT token
 */
export async function generateUnsubscribeToken(userId: string): Promise<string> {
  const { token } = await generateToken(
    {
      userId,
      purpose: TokenPurpose.UNSUBSCRIBE,
    },
    TokenExpiry.UNSUBSCRIBE
  )
  return token
}

/**
 * Verify an unsubscribe token
 * QA Fix: Now includes revocation check
 *
 * @param token - Unsubscribe token
 * @returns User ID from token
 * @throws Error if token is invalid, expired, or revoked
 */
export async function verifyUnsubscribeToken(token: string): Promise<string> {
  const payload = await verifyToken(token, TokenPurpose.UNSUBSCRIBE)
  return payload.userId
}

/**
 * Revoke a token (e.g., after unsubscribe action)
 * QA Fix: Token revocation mechanism
 *
 * @param token - JWT token to revoke
 * @param reason - Optional reason for revocation
 * @throws Error if token cannot be revoked
 */
export async function revokeToken(token: string, reason?: string): Promise<void> {
  try {
    // First verify the token to get its payload
    const payload = await jwtVerify(token, secret, {
      issuer: "real-estate-portfolio",
      audience: "user",
    })

    const jti = payload.payload.jti as string
    const userId = payload.payload.userId as string
    const purpose = payload.payload.purpose as string
    const exp = payload.payload.exp as number

    if (!jti || !userId || !purpose) {
      throw new Error("Invalid token: missing required claims")
    }

    // Calculate expiry date from exp claim (in seconds)
    const expiresAt = new Date(exp * 1000)

    // Insert into revoked tokens table
    await db.insert(revokedTokens).values({
      jti,
      userId,
      purpose,
      expiresAt,
      reason: reason ?? null,
    })

    console.log(`Token ${jti} revoked for user ${userId}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to revoke token:", error.message)
      throw new Error(`Token revocation failed: ${error.message}`)
    }
    throw new Error("Token revocation failed")
  }
}
