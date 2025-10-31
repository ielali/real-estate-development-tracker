"use server"

import { emailService } from "@/lib/email"
import { headers } from "next/headers"

/**
 * QA Fix (SEC-004): Server action to send 2FA state change notifications
 */
export async function send2FANotification(
  user: { email: string; name: string },
  action: "enabled" | "disabled" | "backup-codes-regenerated"
) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined
    const userAgent = headersList.get("user-agent") || undefined

    await emailService.send2FANotification({
      user,
      action,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to send 2FA notification email:", error)
    // Don't throw - email failure shouldn't block the 2FA operation
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
