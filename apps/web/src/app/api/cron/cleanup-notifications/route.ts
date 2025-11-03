/**
 * Notification Cleanup Cron Job API Route
 * Story 8.1: In-App Notification System (AC #15)
 *
 * This endpoint can be called by:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - External cron services
 * - Manual triggers
 *
 * Security:
 * - Requires CRON_SECRET environment variable for authentication
 * - Only accessible via POST requests
 * - Returns detailed cleanup results
 *
 * Example Vercel Cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-notifications",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import {
  cleanupOldNotifications,
  countOldNotifications,
} from "@/server/services/notification-cleanup"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * POST /api/cron/cleanup-notifications
 *
 * Deletes notifications older than 90 days
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Check if cron secret is configured
    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET environment variable not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Cron secret not configured",
        },
        { status: 500 }
      )
    }

    // Verify authorization token
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[Cron] Unauthorized cleanup attempt")
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get("dryRun") === "true"
    const daysOld = parseInt(searchParams.get("days") || "90", 10)

    // Validate daysOld parameter
    if (isNaN(daysOld) || daysOld < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid days parameter. Must be a positive integer.",
        },
        { status: 400 }
      )
    }

    console.log(`[Cron] Cleanup job started (dryRun: ${dryRun}, daysOld: ${daysOld})`)

    if (dryRun) {
      // Dry run - just count notifications that would be deleted
      const { count, cutoffDate } = await countOldNotifications(daysOld)

      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Would delete ${count} notifications`,
        count,
        cutoffDate: cutoffDate.toISOString(),
        daysOld,
      })
    }

    // Perform actual cleanup
    const { deletedCount, cutoffDate } = await cleanupOldNotifications(daysOld)

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Successfully deleted ${deletedCount} notifications`,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      daysOld,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Cleanup job failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/cleanup-notifications
 *
 * Returns count of notifications that would be deleted (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Cron secret not configured",
        },
        { status: 500 }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const daysOld = parseInt(searchParams.get("days") || "90", 10)

    if (isNaN(daysOld) || daysOld < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid days parameter. Must be a positive integer.",
        },
        { status: 400 }
      )
    }

    const { count, cutoffDate } = await countOldNotifications(daysOld)

    return NextResponse.json({
      success: true,
      count,
      cutoffDate: cutoffDate.toISOString(),
      daysOld,
      message: `${count} notifications are older than ${daysOld} days`,
    })
  } catch (error) {
    console.error("[Cron] Count query failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
