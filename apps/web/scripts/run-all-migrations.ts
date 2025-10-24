import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import ws from "ws"
import { getDatabaseUrl } from "../src/server/db/get-database-url"
import { sql } from "drizzle-orm"

async function main() {
  console.log("Running all migrations...")

  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws
  }

  const dbUrl = getDatabaseUrl()
  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  const migrations = [
    "../drizzle/0001_quiet_meltdown.sql",
    "../drizzle/0002_cultured_captain_universe.sql",
    "../drizzle/0003_add_tax_fields_to_categories.sql",
  ]

  for (const migrationFile of migrations) {
    console.log(`\nRunning ${migrationFile}...`)
    const migrationSQL = readFileSync(migrationFile, "utf-8")
    const statements = migrationSQL.split(";").filter((s) => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(sql.raw(statement))
        } catch (error: unknown) {
          console.error(`Error:`, error.message)
        }
      }
    }
    console.log(`✅ ${migrationFile} completed`)
  }

  await pool.end()
  console.log("\n✅ All migrations completed!")
}

main().catch(console.error)
