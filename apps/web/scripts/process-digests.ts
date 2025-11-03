/**
 * Digest Email Processor
 * Story 8.2: AC #8, #9, #12 - Process daily and weekly digest emails
 *
 * This script processes queued notifications and sends digest emails.
 * Can be run manually or scheduled via Netlify scheduled functions.
 *
 * Usage:
 *   bun run scripts/process-digests.ts --type daily
 *   bun run scripts/process-digests.ts --type weekly
 *   bun run scripts/process-digests.ts --type all
 */

import { db } from "@/server/db"
import { digestQueue } from "@/server/db/schema/digest_queue"
import { notifications } from "@/server/db/schema/notifications"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { emailLogs } from "@/server/db/schema/email_logs"
import { eq, and, lte, inArray } from "drizzle-orm"
import { generateUnsubscribeToken } from "@/server/utils/jwt"
import { Resend } from "resend"

interface DigestNotification {
  id: string
  type: string
  message: string
  entityId: string
  projectId: string
  projectName: string
  createdAt: Date
}

interface GroupedDigest {
  userId: string
  userName: string
  userEmail: string
  digestType: "daily" | "weekly"
  notifications: DigestNotification[]
  projectGroups: Map<string, DigestNotification[]>
}

/**
 * Process daily digests
 */
async function processDailyDigests(): Promise<number> {
  console.log("Processing daily digests...")

  const now = new Date()

  // Query all users with daily digest enabled and pending queue items
  const pendingDigests = await db
    .select({
      queueId: digestQueue.id,
      userId: digestQueue.userId,
      notificationId: digestQueue.notificationId,
      userName: users.name,
      userEmail: users.email,
      scheduledFor: digestQueue.scheduledFor,
    })
    .from(digestQueue)
    .innerJoin(users, eq(digestQueue.userId, users.id))
    .innerJoin(notificationPreferences, eq(digestQueue.userId, notificationPreferences.userId))
    .where(
      and(
        eq(digestQueue.digestType, "daily"),
        eq(digestQueue.processed, false),
        lte(digestQueue.scheduledFor, now),
        eq(notificationPreferences.emailDigestFrequency, "daily")
      )
    )

  if (pendingDigests.length === 0) {
    console.log("No daily digests to process")
    return 0
  }

  // Group by user
  const userDigests = new Map<string, GroupedDigest>()

  for (const digest of pendingDigests) {
    if (!userDigests.has(digest.userId)) {
      userDigests.set(digest.userId, {
        userId: digest.userId,
        userName: digest.userName,
        userEmail: digest.userEmail,
        digestType: "daily",
        notifications: [],
        projectGroups: new Map(),
      })
    }
  }

  // Fetch full notification details for all notifications
  const notificationIds = pendingDigests.map((d) => d.notificationId)
  const notificationDetails = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      message: notifications.message,
      entityId: notifications.entityId,
      projectId: notifications.projectId,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(inArray(notifications.id, notificationIds))

  // Fetch project names
  const projectData = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)

  const projectMap = new Map(projectData.map((p) => [p.id, p.name]))

  // Group notifications by user and project
  for (const notification of notificationDetails) {
    const userDigest = userDigests.get(notification.userId)
    if (!userDigest) continue

    const digestNotification: DigestNotification = {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      entityId: notification.entityId,
      projectId: notification.projectId,
      projectName: projectMap.get(notification.projectId) ?? "Unknown Project",
      createdAt: notification.createdAt,
    }

    userDigest.notifications.push(digestNotification)

    // Group by project
    if (!userDigest.projectGroups.has(notification.projectId)) {
      userDigest.projectGroups.set(notification.projectId, [])
    }
    userDigest.projectGroups.get(notification.projectId)!.push(digestNotification)
  }

  // Prepare batch emails with unsubscribe tokens
  const batchEmails: Array<{
    userId: string
    email: {
      to: string
      from: string
      subject: string
      html: string
      text: string
      tags: Record<string, string>
    }
    queueIds: string[]
    notificationCount: number
  }> = []

  for (const [userId, digest] of userDigests) {
    if (digest.notifications.length === 0) continue

    try {
      // Generate unsubscribe token for this user
      const unsubscribeToken = await generateUnsubscribeToken(userId)

      // Import email template generators
      const { generateDailyDigestHTML, generateDailyDigestText } = await import(
        "@/lib/notification-email-templates"
      )

      const emailData = {
        userName: digest.userName,
        recipientEmail: digest.userEmail,
        notifications: Array.from(digest.projectGroups.entries()).map(([projectId, notifs]) => ({
          projectId,
          projectName: notifs[0]!.projectName,
          notifications: notifs,
        })),
        date: now,
        unsubscribeToken,
      }

      const subject = `Daily Project Digest - Real Estate Portfolio`
      const html = generateDailyDigestHTML(emailData)
      const text = generateDailyDigestText(emailData)

      // Get queue IDs for this user
      const queueIds = pendingDigests.filter((d) => d.userId === userId).map((d) => d.queueId)

      batchEmails.push({
        userId,
        email: {
          to: digest.userEmail,
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          subject,
          html,
          text,
          tags: {
            type: "digest",
            digestType: "daily",
            date: now.toISOString().split("T")[0],
          },
        },
        queueIds,
        notificationCount: digest.notifications.length,
      })
    } catch (error) {
      console.error(`✗ Failed to prepare digest for ${digest.userEmail}:`, error)
    }
  }

  if (batchEmails.length === 0) {
    console.log("No digest emails to send")
    return 0
  }

  // Send emails in batches of 100 (Resend limit)
  let emailsSent = 0
  const resend = new Resend(process.env.RESEND_API_KEY)

  for (let i = 0; i < batchEmails.length; i += 100) {
    const batch = batchEmails.slice(i, i + 100)

    try {
      // Send batch
      const result = await resend.batch.send(batch.map((b) => b.email))

      // Process results
      if (result.data) {
        for (let j = 0; j < result.data.length; j++) {
          const emailResult = result.data[j]
          const emailData = batch[j]

          if (!emailData) continue

          // Mark queue items as processed
          if (emailData.queueIds.length > 0) {
            await db
              .update(digestQueue)
              .set({
                processed: true,
                processedAt: now,
              })
              .where(inArray(digestQueue.id, emailData.queueIds))
          }

          // Log email
          await db.insert(emailLogs).values({
            userId: emailData.userId,
            emailType: "daily_digest",
            recipientEmail: emailData.email.to,
            subject: emailData.email.subject,
            status: "sent",
            resendId: emailResult?.id || null,
            attempts: 1,
          })

          emailsSent++
          console.log(
            `✓ Sent daily digest to ${emailData.email.to} (${emailData.notificationCount} notifications)`
          )
        }
      }

      // Handle batch errors (if using permissive validation)
      if ("errors" in result && result.errors) {
        for (const error of result.errors) {
          const emailData = batch[error.index]
          if (emailData) {
            console.error(`✗ Failed to send digest to ${emailData.email.to}:`, error.message)
          }
        }
      }
    } catch (error) {
      console.error(`✗ Batch send failed:`, error)
      // Continue with next batch
    }
  }

  return emailsSent
}

/**
 * Process weekly digests
 */
async function processWeeklyDigests(): Promise<number> {
  console.log("Processing weekly digests...")

  const now = new Date()

  // Check if it's Monday
  if (now.getDay() !== 1) {
    console.log("Not Monday, skipping weekly digests")
    return 0
  }

  // Query all users with weekly digest enabled and pending queue items
  const pendingDigests = await db
    .select({
      queueId: digestQueue.id,
      userId: digestQueue.userId,
      notificationId: digestQueue.notificationId,
      userName: users.name,
      userEmail: users.email,
      scheduledFor: digestQueue.scheduledFor,
    })
    .from(digestQueue)
    .innerJoin(users, eq(digestQueue.userId, users.id))
    .innerJoin(notificationPreferences, eq(digestQueue.userId, notificationPreferences.userId))
    .where(
      and(
        eq(digestQueue.digestType, "weekly"),
        eq(digestQueue.processed, false),
        lte(digestQueue.scheduledFor, now),
        eq(notificationPreferences.emailDigestFrequency, "weekly")
      )
    )

  if (pendingDigests.length === 0) {
    console.log("No weekly digests to process")
    return 0
  }

  // Similar logic to daily digests
  // (Implementation would be similar to processDailyDigests)
  console.log(`Found ${pendingDigests.length} weekly digest queue items`)

  return 0 // TODO: Implement full weekly digest logic
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const typeArg = args.find((arg) => arg.startsWith("--type="))
  const type = typeArg ? typeArg.split("=")[1] : "all"

  console.log(`\n=== Digest Email Processor ===`)
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log(`Type: ${type}\n`)

  let totalProcessed = 0

  try {
    if (type === "daily" || type === "all") {
      const dailyCount = await processDailyDigests()
      totalProcessed += dailyCount
      console.log(`\n✓ Processed ${dailyCount} daily digest(s)\n`)
    }

    if (type === "weekly" || type === "all") {
      const weeklyCount = await processWeeklyDigests()
      totalProcessed += weeklyCount
      console.log(`\n✓ Processed ${weeklyCount} weekly digest(s)\n`)
    }

    console.log(`\n=== Summary ===`)
    console.log(`Total digests sent: ${totalProcessed}`)
    console.log(`Completed at: ${new Date().toISOString()}\n`)

    process.exit(0)
  } catch (error) {
    console.error("\n✗ Error processing digests:", error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { processDailyDigests, processWeeklyDigests }
