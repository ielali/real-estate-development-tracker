import { migrate } from "drizzle-orm/neon-serverless/migrator"
import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as path from "path"
import ws from "ws"
import dotenv from "dotenv"

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

  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  console.log(
    `Using database: ${dbUrl.includes("purple-heart") ? "TEST DATABASE" : dbUrl.includes("shiny-meadow") ? "DEVELOPMENT DATABASE" : "PRODUCTION DATABASE"}`
  )

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
