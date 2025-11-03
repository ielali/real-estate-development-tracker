/**
 * JWT Utilities
 * Story 8.2: Proper JWT token generation and verification for unsubscribe links
 *
 * Uses jose library for secure JWT operations
 */

import { SignJWT, jwtVerify } from "jose"

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
 * Generate a JWT token
 *
 * @param payload - Token payload
 * @param expiresIn - Expiry duration in milliseconds
 * @returns Signed JWT token
 */
export async function generateToken(
  payload: {
    userId: string
    purpose: TokenPurposeType
    [key: string]: unknown
  },
  expiresIn: number
): Promise<string> {
  const expiryDate = new Date(Date.now() + expiresIn)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiryDate.getTime() / 1000)) // Convert to seconds
    .setIssuer("real-estate-portfolio")
    .setAudience("user")
    .sign(secret)

  return token
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token to verify
 * @param expectedPurpose - Optional expected purpose to validate
 * @returns Decoded token payload
 * @throws Error if token is invalid, expired, or purpose doesn't match
 */
export async function verifyToken<T = Record<string, unknown>>(
  token: string,
  expectedPurpose?: TokenPurposeType
): Promise<T & { userId: string; purpose: TokenPurposeType }> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "real-estate-portfolio",
      audience: "user",
    })

    // Validate purpose if specified
    if (expectedPurpose && payload.purpose !== expectedPurpose) {
      throw new Error(`Invalid token purpose. Expected ${expectedPurpose}, got ${payload.purpose}`)
    }

    return payload as T & { userId: string; purpose: TokenPurposeType }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific JWT errors
      if (error.message.includes("expired")) {
        throw new Error("Token has expired")
      }
      if (error.message.includes("signature")) {
        throw new Error("Invalid token signature")
      }
      throw error
    }
    throw new Error("Token verification failed")
  }
}

/**
 * Generate an unsubscribe token for email notifications
 *
 * @param userId - User ID
 * @returns Unsubscribe JWT token
 */
export async function generateUnsubscribeToken(userId: string): Promise<string> {
  return generateToken(
    {
      userId,
      purpose: TokenPurpose.UNSUBSCRIBE,
    },
    TokenExpiry.UNSUBSCRIBE
  )
}

/**
 * Verify an unsubscribe token
 *
 * @param token - Unsubscribe token
 * @returns User ID from token
 * @throws Error if token is invalid or expired
 */
export async function verifyUnsubscribeToken(token: string): Promise<string> {
  const payload = await verifyToken(token, TokenPurpose.UNSUBSCRIBE)
  return payload.userId
}
