import { migrate } from "drizzle-orm/neon-serverless/migrator"
import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as path from "path"
import ws from "ws"

async function main() {
  console.log("Running PostgreSQL migrations...")
  neonConfig.webSocketConstructor = ws

  const dbUrl = process.env.NETLIFY_DATABASE_URL

  if (!dbUrl) {
    throw new Error("NETLIFY_DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  })

  await pool.end()
  console.log("PostgreSQL migrations completed successfully!")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
