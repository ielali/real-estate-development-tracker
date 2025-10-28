import * as path from "path"
import dotenv from "dotenv"
import { existsSync } from "fs"
import { getDatabaseUrl, getDatabaseEnvironment } from "./get-database-url"

// Load .env file if it exists (for local development)
const envPath = path.join(process.cwd(), ".env")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

async function main() {
  console.log("Running PostgreSQL migrations...")

  const dbUrl = getDatabaseUrl()
  const driver = process.env.DATABASE_DRIVER || "neon"
  console.log(`Using database: ${getDatabaseEnvironment()}`)
  console.log(`Using driver: ${driver}`)

  const migrationsFolder = path.join(process.cwd(), "drizzle")
  console.log(`Migrations folder: ${migrationsFolder}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pool: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any = null

  try {
    if (driver === "postgresql") {
      // Use standard PostgreSQL driver for local development
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const postgresModule = require("postgres")
      const postgres = postgresModule.default || postgresModule
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { drizzle } = require("drizzle-orm/postgres-js")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { migrate } = require("drizzle-orm/postgres-js/migrator")

      client = postgres(dbUrl, { max: 1 })
      const db = drizzle(client, { logger: true })

      await migrate(db, {
        migrationsFolder,
      })

      await client.end()
    } else {
      // Use Neon serverless driver for production
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { drizzle } = require("drizzle-orm/neon-serverless")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Pool, neonConfig } = require("@neondatabase/serverless")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { migrate } = require("drizzle-orm/neon-serverless/migrator")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ws = require("ws")

      // Configure Neon WebSocket for Node.js environment
      if (typeof WebSocket === "undefined") {
        neonConfig.webSocketConstructor = ws
      }

      pool = new Pool({ connectionString: dbUrl })
      const db = drizzle(pool, { logger: true })

      await migrate(db, {
        migrationsFolder,
      })

      await pool.end()
    }

    console.log("PostgreSQL migrations completed successfully!")
  } catch (err) {
    // Cleanup on error
    if (pool) await pool.end()
    if (client) await client.end()
    throw err
  }
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
