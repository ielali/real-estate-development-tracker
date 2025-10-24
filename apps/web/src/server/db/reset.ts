import { db } from "./index"
import { sql } from "drizzle-orm"
import { execSync } from "child_process"
import { checkProductionSafety, parseSafetyFlags } from "./safety-check"

async function reset() {
  console.log("🔄 Starting database reset...")

  // Safety check: Prevent accidental production data loss
  const safetyFlags = parseSafetyFlags()
  await checkProductionSafety({
    operation: "reset",
    allowProduction: safetyFlags.allowProduction,
    skipPrompt: safetyFlags.skipPrompt,
  })

  try {
    console.log("Dropping all tables...")

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

    console.log("Running migrations...")
    execSync("tsx src/server/db/migrate.ts", { stdio: "inherit" })

    console.log("Running seed...")
    execSync("tsx src/server/db/seed.ts", { stdio: "inherit" })

    console.log("✅ Database reset completed successfully!")
  } catch (error) {
    console.error("❌ Reset failed:", error)
    process.exit(1)
  }
}

reset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
