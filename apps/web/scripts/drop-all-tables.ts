import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import { sql } from "drizzle-orm"

// Configure WebSocket
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

async function dropAllTables(dbUrl: string, dbName: string) {
  console.log(`\n🗑️  Dropping all tables from ${dbName}...`)

  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  try {
    // Drop all tables including Drizzle migration tracking tables
    await db.execute(sql`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables in public schema
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
          RAISE NOTICE 'Dropped table: %', r.tablename;
        END LOOP;

        -- Drop all sequences in public schema
        FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
          RAISE NOTICE 'Dropped sequence: %', r.sequencename;
        END LOOP;

        -- Drop the drizzle schema entirely (contains migration tracking)
        DROP SCHEMA IF EXISTS drizzle CASCADE;
        RAISE NOTICE 'Dropped drizzle schema';
      END $$;
    `)

    console.log(`✅ All tables dropped from ${dbName}`)
  } catch (error: unknown) {
    console.error(`❌ Error dropping tables from ${dbName}:`, error.message)
    throw error
  } finally {
    await pool.end()
  }
}

async function main() {
  console.log("🔄 Dropping all tables from both databases...")

  // Drop from development database
  const devUrl = process.env.NETLIFY_DATABASE_URL
  if (!devUrl) {
    throw new Error("NETLIFY_DATABASE_URL not set")
  }
  await dropAllTables(devUrl, "DEVELOPMENT DATABASE")

  // Drop from test database
  const testUrl = process.env.NETLIFY_TEST_DATABASE_URL
  if (!testUrl) {
    throw new Error("NETLIFY_TEST_DATABASE_URL not set")
  }
  await dropAllTables(testUrl, "TEST DATABASE")

  console.log("\n✅ All tables dropped from both databases!")
  console.log("\nNext steps:")
  console.log("  1. Run: bun run db:migrate")
  console.log("  2. Run: NODE_ENV=test bun run db:migrate")
  console.log("  3. Run: bun run db:seed")
}

main().catch((error) => {
  console.error("Failed:", error)
  process.exit(1)
})
