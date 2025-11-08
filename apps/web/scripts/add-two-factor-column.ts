import dotenv from "dotenv"
import { existsSync } from "fs"
import * as path from "path"
import { getDatabaseUrl } from "../src/server/db/get-database-url"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import { sql } from "drizzle-orm"
import * as ws from "ws"

// Load .env file if it exists
const envPath = path.join(process.cwd(), ".env")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

async function main() {
  console.log("Adding two_factor_enabled column to users table...")

  const dbUrl = getDatabaseUrl()
  neonConfig.webSocketConstructor = ws
  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
          ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
          RAISE NOTICE 'Added two_factor_enabled column';
        ELSE
          RAISE NOTICE 'Column two_factor_enabled already exists';
        END IF;
      END $$;
    `)

    console.log("✅ Column added successfully!")
  } catch (error) {
    console.error("❌ Failed to add column:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
