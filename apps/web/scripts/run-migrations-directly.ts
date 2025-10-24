import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import ws from "ws"
import { getDatabaseUrl } from "../src/server/db/get-database-url"
import { sql } from "drizzle-orm"

async function main() {
  console.log("Running migrations directly...")

  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws
  }

  const dbUrl = getDatabaseUrl()
  console.log("Database URL configured")

  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  // Read and execute the first migration SQL
  const migrationSQL = readFileSync("../drizzle/0000_minor_wallop.sql", "utf-8")
  console.log(`Migration SQL length: ${migrationSQL.length} characters`)

  // Split by semicolons and execute each statement
  const statements = migrationSQL.split(";").filter((s) => s.trim())
  console.log(`Found ${statements.length} SQL statements`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim()
    if (statement) {
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        await db.execute(sql.raw(statement))
      } catch (error: unknown) {
        console.error(`Error in statement ${i + 1}:`, error.message)
      }
    }
  }

  await pool.end()
  console.log("Done!")
}

main().catch(console.error)
