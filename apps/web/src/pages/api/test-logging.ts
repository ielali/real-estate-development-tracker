/**
 * Simple test endpoint to verify Netlify function logging works
 *
 * Test by visiting: https://your-site.netlify.app/api/test-logging
 */

import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const timestamp = new Date().toISOString()

  // Try every logging method
  console.log("✅ [LOG] Test logging endpoint called at", timestamp)
  console.error("✅ [ERROR] Test logging endpoint called at", timestamp)
  console.warn("✅ [WARN] Test logging endpoint called at", timestamp)
  console.info("✅ [INFO] Test logging endpoint called at", timestamp)
  console.debug("✅ [DEBUG] Test logging endpoint called at", timestamp)

  process.stdout.write(`✅ [STDOUT] Test logging endpoint called at ${timestamp}\n`)
  process.stderr.write(`✅ [STDERR] Test logging endpoint called at ${timestamp}\n`)

  // Log environment info
  console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    CONTEXT: process.env.CONTEXT,
    NETLIFY: process.env.NETLIFY,
    DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
    URL: process.env.URL,
  })

  return res.status(200).json({
    success: true,
    message: "Test logging endpoint - check Netlify function logs",
    timestamp,
    logs: "Should appear in: Netlify Dashboard > Functions > View logs",
  })
}
