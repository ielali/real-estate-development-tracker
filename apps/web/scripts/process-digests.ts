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
import { eq, and, lte } from "drizzle-orm"
import { emailService } from "@/lib/email"

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

  // Fetch full notification details
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
    .where(eq(notifications.id, notificationIds[0])) // TODO: Fix to handle multiple IDs

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

  // Send digest emails
  let emailsSent = 0

  for (const [userId, digest] of userDigests) {
    if (digest.notifications.length === 0) continue

    try {
      await emailService.sendDailyDigestEmail({
        userName: digest.userName,
        recipientEmail: digest.userEmail,
        notifications: Array.from(digest.projectGroups.entries()).map(([projectId, notifs]) => ({
          projectId,
          projectName: notifs[0]!.projectName,
          notifications: notifs,
        })),
        date: now,
        unsubscribeToken: "", // TODO: Generate unsubscribe token
      })

      // Mark queue items as processed
      const queueIds = pendingDigests.filter((d) => d.userId === userId).map((d) => d.queueId)

      await db
        .update(digestQueue)
        .set({
          processed: true,
          processedAt: now,
        })
        .where(eq(digestQueue.id, queueIds[0])) // TODO: Handle multiple IDs

      emailsSent++
      console.log(
        `✓ Sent daily digest to ${digest.userEmail} (${digest.notifications.length} notifications)`
      )
    } catch (error) {
      console.error(`✗ Failed to send daily digest to ${digest.userEmail}:`, error)
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
