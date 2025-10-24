import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "./schema"
import ws from "ws"
import dotenv from "dotenv"
import * as path from "path"
import { getDatabaseUrl } from "./get-database-url"

// Load environment variables from .env file when running scripts
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(process.cwd(), ".env") })
}

// Configure Neon for WebSocket support (needed for serverless environments)
// This is required for Neon PostgreSQL connections in Node.js
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

// Create database connection
const createDatabase = () => {
  const dbUrl = getDatabaseUrl()
  const pool = new Pool({ connectionString: dbUrl })
  return drizzle(pool, { schema })
}

export const db = createDatabase()

export type Database = typeof db

export * from "./schema"
export * from "./types"
