import * as schema from "./schema"
import dotenv from "dotenv"
import * as path from "path"
import { getDatabaseUrl } from "./get-database-url"

// Load environment variables from .env file when running scripts
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(process.cwd(), ".env") })
}

// Create database connection with driver abstraction
const createDatabase = () => {
  const dbUrl = getDatabaseUrl()
  const driver = process.env.DATABASE_DRIVER || "neon"

  if (driver === "postgresql") {
    // Use standard PostgreSQL driver for local development
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const postgresModule = require("postgres")
    const postgres = postgresModule.default || postgresModule
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { drizzle } = require("drizzle-orm/postgres-js")

    const client = postgres(dbUrl)
    return drizzle(client, {
      schema,
      logger: process.env.NODE_ENV === "development",
    })
  } else {
    // Use Neon serverless driver (default for production)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { drizzle } = require("drizzle-orm/neon-serverless")
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool, neonConfig } = require("@neondatabase/serverless")
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ws = require("ws")

    // Configure Neon for WebSocket support (needed for serverless environments)
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws
    }

    const pool = new Pool({ connectionString: dbUrl })
    return drizzle(pool, {
      schema,
      logger: process.env.NODE_ENV === "development",
    })
  }
}

export const db = createDatabase()

export type Database = typeof db

export * from "./schema"
export * from "./types"
