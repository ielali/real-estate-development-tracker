import { getDatabaseUrl } from "./get-database-url"

/**
 * Database Safety Check
 *
 * Multi-layered protection against accidental destructive operations on production database.
 *
 * Safety Layers:
 * 1. Environment detection (NODE_ENV)
 * 2. URL pattern matching (production database identifiers)
 * 3. Explicit confirmation flag requirement for production
 * 4. Interactive prompt with exact match required
 */

export interface SafetyCheckOptions {
  /**
   * Operation being performed (e.g., "reset", "rebuild")
   */
  operation: "reset" | "rebuild" | "drop"

  /**
   * Explicit flag to allow production operations
   * Must be set via command line argument: --allow-production
   */
  allowProduction?: boolean

  /**
   * Skip interactive prompts (for CI/CD environments)
   * Requires allowProduction to be true
   */
  skipPrompt?: boolean
}

export interface EnvironmentInfo {
  isProduction: boolean
  isProbablyProduction: boolean
  nodeEnv: string | undefined
  databaseUrl: string
  environmentLabel: string
}

/**
 * Detect database environment with multiple heuristics
 */
export function detectEnvironment(): EnvironmentInfo {
  const nodeEnv = process.env.NODE_ENV
  const databaseUrl = getDatabaseUrl()

  // Primary check: NODE_ENV
  const isProduction = nodeEnv === "production"

  // Secondary check: URL patterns
  // If URL doesn't contain known dev/test patterns, assume it might be production
  const isTest = databaseUrl.includes("purple-heart")
  const isDev = databaseUrl.includes("shiny-meadow")
  const isProbablyProduction = !isTest && !isDev

  // Determine environment label
  let environmentLabel: string
  if (isTest) {
    environmentLabel = "TEST DATABASE"
  } else if (isDev) {
    environmentLabel = "DEVELOPMENT DATABASE"
  } else if (isProduction) {
    environmentLabel = "PRODUCTION DATABASE"
  } else {
    environmentLabel = "UNKNOWN DATABASE (possibly production)"
  }

  return {
    isProduction,
    isProbablyProduction,
    nodeEnv,
    databaseUrl,
    environmentLabel,
  }
}

/**
 * Check if production operations are safely allowed
 *
 * @throws {Error} If operation is not allowed
 */
export async function checkProductionSafety(options: SafetyCheckOptions): Promise<void> {
  const env = detectEnvironment()

  // Allow non-production environments without restrictions
  if (!env.isProduction && !env.isProbablyProduction) {
    console.log(`✓ Environment: ${env.environmentLabel}`)
    return
  }

  // PRODUCTION DETECTED - Apply safety checks
  console.log("\n" + "=".repeat(70))
  console.log("⚠️  PRODUCTION DATABASE DETECTED ⚠️")
  console.log("=".repeat(70))
  console.log(`Environment: ${env.environmentLabel}`)
  console.log(`NODE_ENV: ${env.nodeEnv || "not set"}`)
  console.log(`Database: ${maskDatabaseUrl(env.databaseUrl)}`)
  console.log("=".repeat(70) + "\n")

  // Check for explicit production flag
  if (!options.allowProduction) {
    console.error("❌ ERROR: Destructive operations on production require explicit confirmation\n")
    console.error("To allow this operation on production, run:\n")
    console.error(`   npm run db:${options.operation} -- --allow-production\n`)
    console.error("⚠️  WARNING: This will DELETE ALL DATA in the production database!\n")
    process.exit(1)
  }

  // If skipping prompts (CI/CD), require explicit confirmation
  if (options.skipPrompt) {
    console.log("⚠️  Proceeding with production operation (prompt skipped)")
    console.log("   Production flag: CONFIRMED")
    return
  }

  // Interactive confirmation prompt
  await requireInteractiveConfirmation(options.operation, env)
}

/**
 * Require interactive confirmation for production operations
 */
async function requireInteractiveConfirmation(
  operation: string,
  env: EnvironmentInfo
): Promise<void> {
  const readline = await import("readline")

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve, reject) => {
    console.log(`\n⚠️  You are about to ${operation.toUpperCase()} the PRODUCTION database!`)
    console.log(`   Database: ${maskDatabaseUrl(env.databaseUrl)}`)
    console.log(`   Environment: ${env.environmentLabel}`)
    console.log("\n   This will:")

    if (operation === "reset") {
      console.log("   - DROP all tables in the public schema")
      console.log("   - Re-run migrations (which may be already applied)")
      console.log("   - Re-seed the database")
      console.log("   - DELETE ALL EXISTING DATA")
    } else if (operation === "rebuild") {
      console.log("   - DROP the drizzle migration tracking schema")
      console.log("   - DROP all tables in the public schema")
      console.log("   - Re-run ALL migrations from scratch")
      console.log("   - Re-seed the database")
      console.log("   - DELETE ALL EXISTING DATA AND MIGRATION HISTORY")
    }

    console.log("\n   ⛔ THIS ACTION CANNOT BE UNDONE ⛔\n")

    rl.question('Type "DELETE ALL PRODUCTION DATA" (exactly) to confirm: ', (answer) => {
      rl.close()

      if (answer === "DELETE ALL PRODUCTION DATA") {
        console.log("\n✓ Confirmation received. Proceeding with production operation...\n")
        resolve()
      } else {
        console.log("\n❌ Confirmation failed. Operation aborted.")
        console.log(`   Expected: "DELETE ALL PRODUCTION DATA"`)
        console.log(`   Received: "${answer}"`)
        console.log("\nNo changes were made to the database.\n")
        reject(new Error("Production operation cancelled by user"))
      }
    })
  })
}

/**
 * Mask sensitive parts of database URL for logging
 */
function maskDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const host = urlObj.hostname

    // Show only the host, mask credentials
    if (urlObj.username) {
      return `postgresql://***:***@${host}/***`
    }
    return `postgresql://${host}/***`
  } catch {
    // If URL parsing fails, just show a generic masked version
    return "postgresql://***:***@***.neon.tech/***"
  }
}

/**
 * Parse command line arguments for safety flags
 */
export function parseSafetyFlags(): { allowProduction: boolean; skipPrompt: boolean } {
  const args = process.argv.slice(2)

  return {
    allowProduction: args.includes("--allow-production"),
    skipPrompt: args.includes("--skip-prompt") || args.includes("--yes") || args.includes("-y"),
  }
}
