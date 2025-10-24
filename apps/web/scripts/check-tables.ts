import { db } from "../src/server/db/index"
import { sql } from "drizzle-orm"

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.log("Tables in database:")
    result.rows.forEach((row: unknown) => console.log(`  - ${row.table_name}`))
  } catch (error) {
    console.error("Error:", error)
  }
  process.exit(0)
}

checkTables()
