import { db } from "./index"
import { sql } from "drizzle-orm"
import { execSync } from "child_process"
import { checkProductionSafety, parseSafetyFlags } from "./safety-check"
import { syncSchema } from "./sync-schema"

/**
 * Database Rebuild Script
 *
 * This script completely recreates the database from scratch:
 * 1. Drops ALL schemas (public AND drizzle migration tracking)
 * 2. Recreates schemas
 * 3. Runs all migrations from the beginning
 * 4. Seeds the database with initial data
 *
 * Use this when:
 * - You need to completely reset migration history
 * - Migrations are out of sync with the database
 * - You want a clean slate for testing
 *
 * WARNING: This will DELETE ALL DATA in the database!
 *
 * For data-only reset (keeping migration history), use db:reset instead.
 *
 * Production Safety:
 * - Requires --allow-production flag for production databases
 * - Requires interactive confirmation with exact text match
 * - Multiple environment detection layers (NODE_ENV + URL patterns)
 */
async function rebuild() {
  console.log("🔨 Starting complete database rebuild...")
  console.log("⚠️  WARNING: This will delete ALL data and migration history!")

  // Safety check: Prevent accidental production data loss
  const safetyFlags = parseSafetyFlags()
  await checkProductionSafety({
    operation: "rebuild",
    allowProduction: safetyFlags.allowProduction,
    skipPrompt: safetyFlags.skipPrompt,
  })

  try {
    console.log("\n1️⃣  Dropping all schemas...")

    // Drop the drizzle migration tracking schema first
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`)
    console.log("   ✓ Dropped drizzle schema")

    // Drop all tables in the public schema
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `)
    console.log("   ✓ Dropped all public tables")

    console.log("\n2️⃣  Running migrations from scratch...")
    execSync("tsx src/server/db/migrate.ts", { stdio: "inherit" })

    console.log("\n3️⃣  Syncing schema (adding any missing columns)...")
    await syncSchema()

    console.log("\n4️⃣  Seeding database...")
    execSync("tsx src/server/db/seed.ts", { stdio: "inherit" })

    console.log("\n✅ Database rebuild completed successfully!")
    console.log("   - All migrations applied from beginning")
    console.log("   - Schema synced with Drizzle definitions")
    console.log("   - Database seeded with initial data")
  } catch (error) {
    console.error("\n❌ Rebuild failed:", error)
    process.exit(1)
  }
}

rebuild()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
