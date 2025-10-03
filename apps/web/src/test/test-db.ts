import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "../server/db/schema"
import ws from "ws"

// Configure Neon WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws

let globalPool: Pool | null = null

// Get test database URL from environment
function getTestDbUrl(): string {
  const testDbUrl = process.env.NEON_TEST_DATABASE_URL || process.env.NETLIFY_DATABASE_URL

  if (!testDbUrl) {
    throw new Error(
      "NEON_TEST_DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required for tests"
    )
  }

  return testDbUrl
}

// Create a dedicated test database connection
export const createTestDb = async () => {
  const dbUrl = getTestDbUrl()

  if (!globalPool) {
    globalPool = new Pool({ connectionString: dbUrl })
  }

  const db = drizzle(globalPool, { schema })

  // NOTE: Assumes test database is already migrated
  // Run `cd apps/web && npx drizzle-kit generate && npx drizzle-kit migrate` on test DB before running tests

  return {
    db,
    cleanup: async () => {
      // Cleanup tables for next test (delete in correct order to respect foreign keys)
      const { sql } = await import("drizzle-orm")
      // Delete in order from child to parent tables
      await db.execute(sql`DELETE FROM costs`)
      await db.execute(sql`DELETE FROM projects`)
      await db.execute(sql`DELETE FROM addresses`)
      await db.execute(sql`DELETE FROM sessions`)
      await db.execute(sql`DELETE FROM accounts`)
      await db.execute(sql`DELETE FROM verifications`)
      await db.execute(sql`DELETE FROM users`)
      // Don't delete categories as they're static seed data
    },
  }
}

// Cleanup function for test teardown
export const cleanupAllTestDatabases = async () => {
  if (globalPool) {
    await globalPool.end()
    globalPool = null
  }
}
