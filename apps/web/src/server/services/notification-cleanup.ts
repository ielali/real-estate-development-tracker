/**
 * Notification Cleanup Service
 * Story 8.1: In-App Notification System
 *
 * Background job to delete notifications older than 90 days (AC #15)
 *
 * This service can be called:
 * - Via API route by a cron job (Vercel Cron, etc.)
 * - Directly from a Node.js script
 * - From any scheduled task runner
 */

import { db } from "@/server/db"
import { notifications } from "@/server/db/schema/notifications"
import { lt, sql } from "drizzle-orm"

/**
 * Delete notifications older than specified days
 *
 * @param daysOld - Number of days (default: 90)
 * @returns Object with count of deleted notifications
 */
export async function cleanupOldNotifications(daysOld = 90): Promise<{
  deletedCount: number
  cutoffDate: Date
}> {
  // Calculate cutoff date (notifications older than this will be deleted)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  console.log(
    `[Notification Cleanup] Starting cleanup for notifications older than ${daysOld} days`
  )
  console.log(`[Notification Cleanup] Cutoff date: ${cutoffDate.toISOString()}`)

  try {
    // Delete notifications older than cutoff date
    const deleted = await db
      .delete(notifications)
      .where(lt(notifications.createdAt, cutoffDate))
      .returning({ id: notifications.id })

    const deletedCount = deleted.length

    console.log(`[Notification Cleanup] Successfully deleted ${deletedCount} notifications`)

    return {
      deletedCount,
      cutoffDate,
    }
  } catch (error) {
    console.error("[Notification Cleanup] Error during cleanup:", error)
    throw new Error(
      `Failed to cleanup old notifications: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Get count of notifications older than specified days (dry run)
 *
 * @param daysOld - Number of days (default: 90)
 * @returns Count of notifications that would be deleted
 */
export async function countOldNotifications(daysOld = 90): Promise<{
  count: number
  cutoffDate: Date
}> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(lt(notifications.createdAt, cutoffDate))

  return {
    count: result[0]?.count ?? 0,
    cutoffDate,
  }
}
