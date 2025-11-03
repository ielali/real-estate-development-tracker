/**
 * Email Notification Integration
 * Story 8.2: Integrates email sending with notification generation
 *
 * This service handles:
 * - User preference checking
 * - Immediate email vs digest queuing
 * - Rate limiting
 * - Email logging
 * - Unsubscribe token generation
 */

import { db } from "@/server/db"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"
import { emailLogs } from "@/server/db/schema/email_logs"
import { digestQueue } from "@/server/db/schema/digest_queue"
import { users } from "@/server/db/schema/users"
import { eq } from "drizzle-orm"
import { emailService } from "@/lib/email"
import { emailRateLimiter } from "@/server/utils/email-rate-limiter"
import { generateUnsubscribeToken } from "@/server/utils/jwt"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { addDays, nextMonday, set, isAfter } from "date-fns"
import type {
  CostEmailData,
  LargeExpenseEmailData,
  DocumentEmailData,
  TimelineEventEmailData,
} from "@/lib/notification-email-templates"

/**
 * Log email attempt to database
 */
async function logEmailAttempt(params: {
  userId: string
  notificationId?: string
  emailType: string
  recipientEmail: string
  subject: string
  status: "sent" | "failed"
  error?: string
  resendId?: string
}): Promise<void> {
  try {
    await db.insert(emailLogs).values({
      userId: params.userId,
      notificationId: params.notificationId ?? null,
      emailType: params.emailType,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      status: params.status,
      resendId: params.resendId ?? null,
      attempts: 1,
      lastError: params.error ?? null,
    })
  } catch (error) {
    console.error("Failed to log email attempt:", error)
  }
}

/**
 * Queue notification for digest email
 */
async function queueForDigest(params: {
  userId: string
  notificationId: string
  digestType: "daily" | "weekly"
  scheduledFor: Date
}): Promise<void> {
  try {
    await db.insert(digestQueue).values({
      userId: params.userId,
      notificationId: params.notificationId,
      digestType: params.digestType,
      scheduledFor: params.scheduledFor,
      processed: false,
    })
  } catch (error) {
    console.error("Failed to queue notification for digest:", error)
  }
}

/**
 * Calculate next digest scheduled time based on user's timezone
 * Uses date-fns-tz for proper timezone-aware scheduling
 */
function calculateNextDigestTime(digestType: "daily" | "weekly", timezone: string): Date {
  try {
    // Get current time in user's timezone
    const now = new Date()
    const nowInUserTz = toZonedTime(now, timezone)

    if (digestType === "daily") {
      // Schedule for next 8 AM in user's timezone
      let scheduledTime = set(nowInUserTz, {
        hours: 8,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })

      // If 8 AM has already passed today, schedule for tomorrow
      if (!isAfter(scheduledTime, nowInUserTz)) {
        scheduledTime = addDays(scheduledTime, 1)
      }

      // Convert back to UTC for storage
      return fromZonedTime(scheduledTime, timezone)
    } else {
      // Weekly: Schedule for next Monday 8 AM in user's timezone
      let scheduledTime = nextMonday(nowInUserTz)
      scheduledTime = set(scheduledTime, {
        hours: 8,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })

      // Convert back to UTC for storage
      return fromZonedTime(scheduledTime, timezone)
    }
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    console.error(`Invalid timezone ${timezone}, falling back to UTC:`, error)
    const now = new Date()

    if (digestType === "daily") {
      let scheduledTime = set(now, {
        hours: 8,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      if (!isAfter(scheduledTime, now)) {
        scheduledTime = addDays(scheduledTime, 1)
      }
      return scheduledTime
    } else {
      let scheduledTime = nextMonday(now)
      scheduledTime = set(scheduledTime, {
        hours: 8,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      return scheduledTime
    }
  }
}

/**
 * Send cost added email notification
 * Story 8.2: AC #6, #7
 */
export async function sendCostAddedEmailNotification(params: {
  userId: string
  notificationId: string
  projectId: string
  projectName: string
  costId: string
  costDescription: string
  amount: number // in cents
  userName: string
}): Promise<void> {
  try {
    // Get user preferences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, params.userId))
      .limit(1)

    // Skip if user disabled this notification type
    if (prefs && !prefs.emailOnCost) {
      return
    }

    // Get user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      console.warn(`User ${params.userId} not found for email notification`)
      return
    }

    // Check digest preference
    const digestFrequency = prefs?.emailDigestFrequency ?? "immediate"

    if (digestFrequency === "never") {
      return // User opted out of all emails
    }

    if (digestFrequency === "daily" || digestFrequency === "weekly") {
      // Queue for digest
      const scheduledFor = calculateNextDigestTime(
        digestFrequency,
        prefs?.timezone ?? "Australia/Sydney"
      )
      await queueForDigest({
        userId: params.userId,
        notificationId: params.notificationId,
        digestType: digestFrequency,
        scheduledFor,
      })
      return
    }

    // Send immediate email
    // Check rate limit
    if (!emailRateLimiter.canSendEmail(params.userId, false)) {
      console.warn(`Rate limit exceeded for user ${params.userId}`)
      return
    }

    // Generate unsubscribe token
    const unsubscribeToken = await generateUnsubscribeToken(params.userId)

    // Prepare email data
    const emailData: CostEmailData = {
      userName: params.userName,
      projectName: params.projectName,
      projectId: params.projectId,
      costDescription: params.costDescription,
      amount: params.amount,
      costId: params.costId,
      recipientEmail: user.email,
      unsubscribeToken,
    }

    // Send email and capture Resend ID
    const resendId = await emailService.sendCostAddedEmail(emailData)

    // Log success with Resend ID
    await logEmailAttempt({
      userId: params.userId,
      notificationId: params.notificationId,
      emailType: "cost_added",
      recipientEmail: user.email,
      subject: `New Cost Added to ${params.projectName} - Real Estate Portfolio`,
      status: "sent",
      resendId: resendId ?? undefined,
    })
  } catch (error) {
    console.error("Failed to send cost added email:", error)
    // Don't throw - fire-and-forget pattern
  }
}

/**
 * Send large expense email notification
 * Story 8.2: AC #6, #7 (bypasses digest and rate limiting)
 */
export async function sendLargeExpenseEmailNotification(params: {
  userId: string
  notificationId: string
  projectId: string
  projectName: string
  costId: string
  costDescription: string
  amount: number // in cents
  userName: string
}): Promise<void> {
  try {
    // Get user preferences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, params.userId))
      .limit(1)

    // Skip if user disabled large expense notifications
    if (prefs && !prefs.emailOnLargeExpense) {
      return
    }

    // Get user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      console.warn(`User ${params.userId} not found for email notification`)
      return
    }

    // Large expense emails ALWAYS send immediately (AC #7)
    // They bypass digest settings and rate limiting

    // Rate limiting allows large expense emails (critical notifications)
    const canSend = emailRateLimiter.canSendEmail(params.userId, true)

    if (!canSend) {
      console.warn(`Rate limit check failed (should not happen for large expense)`)
    }

    // Generate unsubscribe token
    const unsubscribeToken = await generateUnsubscribeToken(params.userId)

    // Prepare email data
    const emailData: LargeExpenseEmailData = {
      userName: params.userName,
      projectName: params.projectName,
      projectId: params.projectId,
      costDescription: params.costDescription,
      amount: params.amount,
      costId: params.costId,
      recipientEmail: user.email,
      unsubscribeToken,
    }

    // Send email and capture Resend ID
    const resendId = await emailService.sendLargeExpenseEmail(emailData)

    // Log success with Resend ID
    await logEmailAttempt({
      userId: params.userId,
      notificationId: params.notificationId,
      emailType: "large_expense",
      recipientEmail: user.email,
      subject: `🚨 Large Expense Alert: ${params.projectName} - Real Estate Portfolio`,
      status: "sent",
      resendId: resendId ?? undefined,
    })
  } catch (error) {
    console.error("Failed to send large expense email:", error)
    // Don't throw - fire-and-forget pattern
  }
}

/**
 * Send document uploaded email notification
 * Story 8.2: AC #6
 */
export async function sendDocumentUploadedEmailNotification(params: {
  userId: string
  notificationId: string
  projectId: string
  projectName: string
  documentId: string
  fileName: string
  userName: string
}): Promise<void> {
  try {
    // Get user preferences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, params.userId))
      .limit(1)

    // Skip if user disabled this notification type
    if (prefs && !prefs.emailOnDocument) {
      return
    }

    // Get user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      return
    }

    // Check digest preference
    const digestFrequency = prefs?.emailDigestFrequency ?? "immediate"

    if (digestFrequency === "never") {
      return
    }

    if (digestFrequency === "daily" || digestFrequency === "weekly") {
      const scheduledFor = calculateNextDigestTime(
        digestFrequency,
        prefs?.timezone ?? "Australia/Sydney"
      )
      await queueForDigest({
        userId: params.userId,
        notificationId: params.notificationId,
        digestType: digestFrequency,
        scheduledFor,
      })
      return
    }

    // Send immediate email with rate limiting
    if (!emailRateLimiter.canSendEmail(params.userId, false)) {
      return
    }

    const unsubscribeToken = await generateUnsubscribeToken(params.userId)

    const emailData: DocumentEmailData = {
      userName: params.userName,
      projectName: params.projectName,
      projectId: params.projectId,
      fileName: params.fileName,
      documentId: params.documentId,
      recipientEmail: user.email,
      unsubscribeToken,
    }

    const resendId = await emailService.sendDocumentUploadedEmail(emailData)

    await logEmailAttempt({
      userId: params.userId,
      notificationId: params.notificationId,
      emailType: "document_uploaded",
      recipientEmail: user.email,
      subject: `New Document Uploaded to ${params.projectName} - Real Estate Portfolio`,
      status: "sent",
      resendId: resendId ?? undefined,
    })
  } catch (error) {
    console.error("Failed to send document uploaded email:", error)
  }
}

/**
 * Send timeline event email notification
 * Story 8.2: AC #6
 */
export async function sendTimelineEventEmailNotification(params: {
  userId: string
  notificationId: string
  projectId: string
  projectName: string
  eventId: string
  eventTitle: string
  eventDate: Date
  userName: string
}): Promise<void> {
  try {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, params.userId))
      .limit(1)

    if (prefs && !prefs.emailOnTimeline) {
      return
    }

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (!user) {
      return
    }

    const digestFrequency = prefs?.emailDigestFrequency ?? "immediate"

    if (digestFrequency === "never") {
      return
    }

    if (digestFrequency === "daily" || digestFrequency === "weekly") {
      const scheduledFor = calculateNextDigestTime(
        digestFrequency,
        prefs?.timezone ?? "Australia/Sydney"
      )
      await queueForDigest({
        userId: params.userId,
        notificationId: params.notificationId,
        digestType: digestFrequency,
        scheduledFor,
      })
      return
    }

    if (!emailRateLimiter.canSendEmail(params.userId, false)) {
      return
    }

    const unsubscribeToken = await generateUnsubscribeToken(params.userId)

    const emailData: TimelineEventEmailData = {
      userName: params.userName,
      projectName: params.projectName,
      projectId: params.projectId,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      eventId: params.eventId,
      recipientEmail: user.email,
      unsubscribeToken,
    }

    const resendId = await emailService.sendTimelineEventEmail(emailData)

    await logEmailAttempt({
      userId: params.userId,
      notificationId: params.notificationId,
      emailType: "timeline_event",
      recipientEmail: user.email,
      subject: `New Timeline Event: ${params.projectName} - Real Estate Portfolio`,
      status: "sent",
      resendId: resendId ?? undefined,
    })
  } catch (error) {
    console.error("Failed to send timeline event email:", error)
  }
}
