import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "./schema"
import ws from "ws"

// Configure Neon for WebSocket support (needed for serverless environments)
// This is required for Neon PostgreSQL connections in Node.js
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

// Create database connection
const createDatabase = () => {
  const dbUrl = process.env.NETLIFY_DATABASE_URL

  if (!dbUrl) {
    throw new Error("NETLIFY_DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString: dbUrl })
  return drizzle(pool, { schema })
}

export const db = createDatabase()

export type Database = typeof db

export * from "./schema"
export * from "./types"
