import { drizzle } from "drizzle-orm/neon-serverless"
import { Pool, neonConfig } from "@neondatabase/serverless"
import * as schema from "../server/db/schema"
import { sql } from "drizzle-orm"
import ws from "ws"

// Configure Neon WebSocket for Node.js environment
// This is required for Neon PostgreSQL connections in Node.js
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

let globalPool: Pool | null = null
let globalDb: ReturnType<typeof drizzle<typeof schema>> | null = null

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

/**
 * Create a test database connection to remote Neon PostgreSQL.
 *
 * IMPORTANT: This assumes:
 * 1. Remote Neon database exists and is migrated
 * 2. Database starts with NO data (empty tables)
 * 3. Each test should clean up its own data in afterEach
 *
 * Usage:
 * - Call once in beforeAll to establish connection
 * - Use cleanup() in afterEach to delete test data
 * - Connection is reused across all tests in suite
 */
export const createTestDb = async () => {
  const dbUrl = getTestDbUrl()

  // Reuse existing connection if available
  if (globalPool && globalDb) {
    return {
      db: globalDb,
      cleanup: createCleanupFunction(globalDb),
    }
  }

  // Create new connection
  globalPool = new Pool({ connectionString: dbUrl })
  globalDb = drizzle(globalPool, { schema })

  return {
    db: globalDb,
    cleanup: createCleanupFunction(globalDb),
  }
}

/**
 * Creates cleanup function that deletes all test data.
 * Uses TRUNCATE CASCADE for reliable cleanup that handles FK constraints automatically.
 * NOTE: Categories table is NOT truncated because it contains static reference data.
 */
function createCleanupFunction(db: ReturnType<typeof drizzle<typeof schema>>) {
  return async () => {
    // TRUNCATE CASCADE automatically handles foreign key dependencies
    // Much more reliable than manual DELETE ordering
    // NOTE: categories table is excluded - it contains static reference data that's seeded once
    await db.execute(sql`
      TRUNCATE TABLE
        audit_log,
        project_contact,
        project_access,
        events,
        documents,
        costs,
        contacts,
        projects,
        sessions,
        accounts,
        verifications,
        addresses,
        users
      CASCADE
    `)
  }
}

/**
 * Close all database connections.
 * Call this in global afterAll if needed.
 */
export const cleanupAllTestDatabases = async () => {
  if (globalPool) {
    await globalPool.end()
    globalPool = null
    globalDb = null
  }
}
