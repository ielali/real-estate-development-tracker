import { migrate } from "drizzle-orm/neon-serverless/migrator"
import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as path from "path"
import ws from "ws"
import dotenv from "dotenv"
import { getDatabaseUrl, getDatabaseEnvironment } from "./get-database-url"

// Load environment variables from .env file (only for local development)
// In Netlify, environment variables are injected automatically
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(process.cwd(), ".env") })
}

async function main() {
  console.log("Running PostgreSQL migrations...")

  // Configure Neon WebSocket for Node.js environment
  if (typeof WebSocket === "undefined") {
    neonConfig.webSocketConstructor = ws
  }

  const dbUrl = getDatabaseUrl()
  console.log(`Using database: ${getDatabaseEnvironment()}`)

  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool, { logger: true })

  const migrationsFolder = path.join(process.cwd(), "drizzle")
  console.log(`Migrations folder: ${migrationsFolder}`)

  await migrate(db, {
    migrationsFolder,
  })

  await pool.end()
  console.log("PostgreSQL migrations completed successfully!")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
