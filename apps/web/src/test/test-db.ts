import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "../server/db/schema"
import { migrate } from "drizzle-orm/neon-serverless/migrator"
import * as path from "path"
import ws from "ws"

// Configure Neon for tests
neonConfig.webSocketConstructor = ws

// Create a dedicated test database connection
export const createTestDb = async () => {
  // Use test database URL or fallback to main database with test suffix
  const dbUrl = process.env.NETLIFY_DATABASE_URL_TEST || process.env.NETLIFY_DATABASE_URL

  if (!dbUrl) {
    throw new Error("NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_TEST is required for tests")
  }

  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool, { schema })

  // Apply migrations
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  })

  return {
    db,
    pool,
    cleanup: async () => {
      await pool.end()
    },
  }
}
