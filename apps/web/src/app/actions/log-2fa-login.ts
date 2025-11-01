"use server"

import { headers } from "next/headers"
import { securityEventLogger } from "@/server/services/security-event-logger"
import { emailService } from "@/lib/email"

/**
 * Server action to log 2FA login success event
 */
export async function log2FALoginSuccess(user: { id: string; email: string; name: string }) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await securityEventLogger.log2FALoginSuccess(user.id, ipAddress, userAgent)

    return { success: true }
  } catch (error) {
    console.error("Failed to log 2FA login success:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Server action to log 2FA login failure event
 */
export async function log2FALoginFailure(userId: string, attempts: number = 1) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await securityEventLogger.log2FALoginFailure(userId, ipAddress, userAgent, attempts)

    return { success: true }
  } catch (error) {
    console.error("Failed to log 2FA login failure:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Server action to log backup code usage
 */
export async function logBackupCodeUsed(user: { id: string; email: string; name: string }) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Log security event
    await securityEventLogger.logBackupCodeUsed(user.id, ipAddress, userAgent)

    // Send email notification
    await emailService.sendBackupCodeUsedEmail(
      { email: user.email, name: user.name },
      new Date(),
      userAgent,
      ipAddress
    )

    return { success: true }
  } catch (error) {
    console.error("Failed to log backup code usage:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
