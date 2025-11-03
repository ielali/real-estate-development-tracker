#!/usr/bin/env bun
/**
 * Manual Notification Cleanup Script
 * Story 8.1: In-App Notification System (AC #15)
 *
 * This script can be run manually to clean up old notifications.
 * It can also be scheduled using cron or other task schedulers.
 *
 * Usage:
 *   bun run scripts/cleanup-notifications.ts [--dry-run] [--days=90]
 *
 * Examples:
 *   # Dry run (shows what would be deleted)
 *   bun run scripts/cleanup-notifications.ts --dry-run
 *
 *   # Delete notifications older than 90 days
 *   bun run scripts/cleanup-notifications.ts
 *
 *   # Delete notifications older than 30 days
 *   bun run scripts/cleanup-notifications.ts --days=30
 */

import {
  cleanupOldNotifications,
  countOldNotifications,
} from "../src/server/services/notification-cleanup"

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const daysArg = args.find((arg) => arg.startsWith("--days="))
  const daysOld = daysArg ? parseInt(daysArg.split("=")[1], 10) : 90

  // Validate days parameter
  if (isNaN(daysOld) || daysOld < 1) {
    console.error("Error: --days must be a positive integer")
    process.exit(1)
  }

  console.log("=".repeat(60))
  console.log("Notification Cleanup Script")
  console.log("=".repeat(60))
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE (will delete)"}`)
  console.log(`Days threshold: ${daysOld}`)
  console.log("=".repeat(60))
  console.log()

  try {
    if (dryRun) {
      const { count, cutoffDate } = await countOldNotifications(daysOld)
      console.log(`✓ Found ${count} notifications older than ${daysOld} days`)
      console.log(`  Cutoff date: ${cutoffDate.toISOString()}`)
      console.log()
      console.log("ℹ️  This was a dry run. No notifications were deleted.")
      console.log("   Run without --dry-run to perform actual cleanup.")
    } else {
      // Confirm before deletion
      console.log("⚠️  WARNING: This will permanently delete old notifications!")
      console.log()

      const { count } = await countOldNotifications(daysOld)
      if (count === 0) {
        console.log("✓ No notifications to delete.")
        process.exit(0)
      }

      console.log(`About to delete ${count} notifications...`)

      // Check if running in CI or with auto-confirm
      const autoConfirm = process.env.CI === "true" || args.includes("--yes")

      if (!autoConfirm) {
        console.log()
        console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }

      const { deletedCount, cutoffDate } = await cleanupOldNotifications(daysOld)

      console.log()
      console.log("✓ Cleanup completed successfully!")
      console.log(`  Deleted: ${deletedCount} notifications`)
      console.log(`  Cutoff date: ${cutoffDate.toISOString()}`)
    }

    console.log()
    console.log("=".repeat(60))
    process.exit(0)
  } catch (error) {
    console.error()
    console.error("✗ Cleanup failed:")
    console.error(error instanceof Error ? error.message : "Unknown error")
    console.error()
    console.error("=".repeat(60))
    process.exit(1)
  }
}

main()
