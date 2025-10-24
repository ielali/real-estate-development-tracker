import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import { getDatabaseUrl } from "./src/server/db/get-database-url.js"
import { readFileSync } from "fs"
import path from "path"
import dotenv from "dotenv"

// Load .env
dotenv.config({ path: path.join(process.cwd(), ".env") })

// Configure WebSocket for Node.js
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

async function main() {
  console.log("Running migration 0003...")
  const pool = new Pool({ connectionString: getDatabaseUrl() })

  try {
    const sql = readFileSync("drizzle/0003_junction_tables_for_events.sql", "utf-8")
    await pool.query(sql)
    console.log("Migration 0003 executed successfully!")

    // Update drizzle migrations table to track that this migration ran
    const hash = "migration-hash-0003" // Simple hash for tracking
    await pool.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [hash, Date.now()]
    )
    console.log("Migration tracked in database")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
