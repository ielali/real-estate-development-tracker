/**
 * Resend Webhook Endpoint
 * Story 8.2: AC #13 - Automatic email delivery tracking
 *
 * Handles Resend webhook events for:
 * - email.delivered - Mark email as delivered
 * - email.bounced - Mark as bounced, auto-unsubscribe on hard bounce
 * - email.complained - Mark as spam complaint
 * - email.failed - Mark as failed
 * - email.opened - Track opens (optional)
 * - email.clicked - Track clicks (optional)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { emailLogs } from "@/server/db/schema/email_logs"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"
import { eq } from "drizzle-orm"

/**
 * Resend webhook event types
 */
interface ResendWebhookEvent {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string
    subject?: string
    from?: string
    created_at?: string
    // Bounce-specific fields
    bounce_type?: "hard" | "soft"
    bounce_subtype?: string
    // Click-specific fields
    link?: string
    ip_address?: string
    // Error fields
    error?: string
    message?: string
  }
}

/**
 * Map Resend event types to our email log statuses
 */
function mapEventToStatus(eventType: string): "sent" | "delivered" | "bounced" | "failed" | null {
  switch (eventType) {
    case "email.sent":
      return "sent"
    case "email.delivered":
      return "delivered"
    case "email.bounced":
      return "bounced"
    case "email.failed":
      return "failed"
    case "email.delivery_delayed":
      return null // Don't update status for delayed delivery
    default:
      return null
  }
}

/**
 * Handle Resend webhook POST request
 */
export async function POST(req: NextRequest) {
  try {
    const event: ResendWebhookEvent = await req.json()

    console.log(`[Resend Webhook] Received event: ${event.type}`, {
      emailId: event.data.email_id,
      to: event.data.to,
    })

    // Extract email ID
    const resendId = event.data.email_id
    if (!resendId) {
      console.warn("[Resend Webhook] No email_id in event data")
      return NextResponse.json({ success: true, message: "No email_id to process" })
    }

    // Find the email log entry
    const [emailLog] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.resendId, resendId))
      .limit(1)

    if (!emailLog) {
      console.warn(`[Resend Webhook] Email log not found for resendId: ${resendId}`)
      return NextResponse.json({ success: true, message: "Email log not found" })
    }

    // Update email log based on event type
    const status = mapEventToStatus(event.type)
    if (status) {
      await db
        .update(emailLogs)
        .set({
          status,
          deliveredAt: event.type === "email.delivered" ? new Date() : undefined,
          lastError: event.data.error || event.data.message || undefined,
        })
        .where(eq(emailLogs.resendId, resendId))

      console.log(`[Resend Webhook] Updated email log ${emailLog.id} to status: ${status}`)
    }

    // Handle hard bounces - automatically unsubscribe user
    if (event.type === "email.bounced" && event.data.bounce_type === "hard") {
      console.log(
        `[Resend Webhook] Hard bounce detected for user ${emailLog.userId}, auto-unsubscribing`
      )

      await db
        .update(notificationPreferences)
        .set({
          emailDigestFrequency: "never",
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, emailLog.userId))

      console.log(`[Resend Webhook] Auto-unsubscribed user ${emailLog.userId}`)
    }

    // Handle spam complaints - auto-unsubscribe
    if (event.type === "email.complained") {
      console.log(
        `[Resend Webhook] Spam complaint from user ${emailLog.userId}, auto-unsubscribing`
      )

      await db
        .update(notificationPreferences)
        .set({
          emailDigestFrequency: "never",
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, emailLog.userId))

      console.log(`[Resend Webhook] Auto-unsubscribed user ${emailLog.userId} after complaint`)
    }

    // TODO: Track opens and clicks for analytics (optional)
    // if (event.type === "email.opened") { ... }
    // if (event.type === "email.clicked") { ... }

    return NextResponse.json({
      success: true,
      message: `Processed ${event.type} event`,
      emailId: resendId,
    })
  } catch (error) {
    console.error("[Resend Webhook] Error processing webhook:", error)

    // Return 200 even on error to prevent Resend from retrying
    // (We don't want to be marked as having webhook delivery issues)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    )
  }
}

/**
 * Verify webhook signature (optional, requires Resend webhook secret)
 *
 * To enable, set RESEND_WEBHOOK_SECRET in environment variables
 * and uncomment the verification code below
 */
// import { createHmac } from "crypto"
//
// function verifyWebhookSignature(req: NextRequest, body: string): boolean {
//   const signature = req.headers.get("resend-signature")
//   const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
//
//   if (!signature || !webhookSecret) {
//     return false
//   }
//
//   const hmac = createHmac("sha256", webhookSecret)
//   hmac.update(body)
//   const expectedSignature = hmac.digest("hex")
//
//   return signature === expectedSignature
// }
