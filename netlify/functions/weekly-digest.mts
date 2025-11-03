/**
 * Netlify Scheduled Function: Weekly Digest Processor
 * Story 8.2: AC #9, #12 - Send weekly digest emails
 *
 * Schedule: Every Monday at 8:00 AM UTC
 * Cron: 0 8 * * 1
 *
 * This function triggers the weekly digest processing script which:
 * - Queries digest_queue for users with emailDigestFrequency='weekly'
 * - Groups notifications by user and project
 * - Sends digest emails with all queued notifications from past 7 days
 * - Marks queue items as processed
 */

import type { Config } from "@netlify/functions"
import { execSync } from "child_process"

export default async (req: Request) => {
  const startTime = Date.now()
  console.log(`[Weekly Digest] Starting at ${new Date().toISOString()}`)

  try {
    // Execute the digest processing script
    const output = execSync("cd apps/web && bun run scripts/process-digests.ts --type weekly", {
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    })

    const duration = Date.now() - startTime
    console.log(`[Weekly Digest] Completed in ${duration}ms`)
    console.log(output)

    return new Response(
      JSON.stringify({
        success: true,
        type: "weekly",
        duration,
        output,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    console.error(`[Weekly Digest] Failed after ${duration}ms:`, errorMessage)
    console.error(error)

    return new Response(
      JSON.stringify({
        success: false,
        type: "weekly",
        duration,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export const config: Config = {
  // Run every Monday at 8:00 AM UTC
  schedule: "0 8 * * 1",
}
