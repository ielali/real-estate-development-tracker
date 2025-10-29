/**
 * Migrate All Databases Script
 *
 * Runs migrations on both test and production databases.
 * Used in CI/CD pipelines to ensure all database schemas are up-to-date.
 */

import { execSync } from "child_process"
import * as path from "path"

async function migrateAllDatabases() {
  console.log("=".repeat(60))
  console.log("🗄️  DATABASE MIGRATION SCRIPT - ALL ENVIRONMENTS")
  console.log("=".repeat(60))
  console.log("")

  const migrateScript = path.join(__dirname, "migrate.ts")
  let testMigrationSuccess = false
  let prodMigrationSuccess = false

  // Step 1: Migrate Test Database
  try {
    console.log("📋 Step 1/2: Migrating TEST database...")
    console.log("-".repeat(60))

    execSync(`NODE_ENV=test tsx ${migrateScript}`, {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    })

    testMigrationSuccess = true
    console.log("")
    console.log("✅ Test database migration completed successfully!")
    console.log("")
  } catch (error) {
    console.error("❌ Test database migration failed!")
    console.error(error)
    console.log("")

    // Check if test database URL is configured
    if (!process.env.NETLIFY_TEST_DATABASE_URL) {
      console.warn(
        "⚠️  NETLIFY_TEST_DATABASE_URL not configured - skipping test database migration"
      )
      console.warn("   Tests may fail if test database schema is outdated")
      console.log("")
    } else {
      // If configured but failed, this is a critical error
      throw new Error("Test database migration failed - cannot proceed")
    }
  }

  // Step 2: Migrate Production Database
  try {
    console.log("📋 Step 2/2: Migrating PRODUCTION database...")
    console.log("-".repeat(60))

    execSync(`NODE_ENV=production tsx ${migrateScript}`, {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    })

    prodMigrationSuccess = true
    console.log("")
    console.log("✅ Production database migration completed successfully!")
    console.log("")
  } catch (error) {
    console.error("❌ Production database migration failed!")
    console.error(error)
    throw new Error("Production database migration failed - cannot deploy")
  }

  // Summary
  console.log("=".repeat(60))
  console.log("📊 MIGRATION SUMMARY")
  console.log("=".repeat(60))
  console.log(`Test Database:       ${testMigrationSuccess ? "✅ SUCCESS" : "⚠️  SKIPPED"}`)
  console.log(`Production Database: ${prodMigrationSuccess ? "✅ SUCCESS" : "❌ FAILED"}`)
  console.log("=".repeat(60))
  console.log("")

  if (prodMigrationSuccess) {
    console.log("✅ All database migrations completed successfully!")
    process.exit(0)
  } else {
    console.error("❌ Database migration failed!")
    process.exit(1)
  }
}

// Run migrations
migrateAllDatabases().catch((err) => {
  console.error("Fatal error during migration:", err)
  process.exit(1)
})
