"use server"

import { emailService } from "@/lib/email"
import { headers } from "next/headers"
import { securityEventLogger } from "@/server/services/security-event-logger"

/**
 * QA Fix (SEC-004): Server action to send 2FA state change notifications and log security events
 */
export async function send2FANotification(
  user: { id: string; email: string; name: string },
  action: "enabled" | "disabled" | "backup-codes-regenerated"
) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Log security event to database
    if (action === "enabled") {
      await securityEventLogger.log2FAEnabled(user.id, ipAddress, userAgent)
      // Also log backup code generation (backup codes are always generated during initial 2FA setup)
      await securityEventLogger.logBackupCodeGenerated(user.id, ipAddress, userAgent, 10)
    } else if (action === "disabled") {
      await securityEventLogger.log2FADisabled(user.id, ipAddress, userAgent)
    } else if (action === "backup-codes-regenerated") {
      await securityEventLogger.logBackupCodeGenerated(user.id, ipAddress, userAgent, 10)
    }

    // Send email notification
    await emailService.send2FANotification({
      user: { email: user.email, name: user.name },
      action,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send 2FA notification or log security event:", error)
    // Don't throw - failures shouldn't block the 2FA operation
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
