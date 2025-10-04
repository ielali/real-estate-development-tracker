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
 * Order matters - delete children before parents to avoid FK violations.
 */
function createCleanupFunction(db: ReturnType<typeof drizzle<typeof schema>>) {
  return async () => {
    // Delete in order from child to parent tables to respect foreign keys
    // Critical: projects must be deleted BEFORE addresses and users (FK dependencies)
    await db.execute(sql`DELETE FROM audit_log`)
    await db.execute(sql`DELETE FROM project_contact`)
    await db.execute(sql`DELETE FROM project_access`)
    await db.execute(sql`DELETE FROM events`)
    await db.execute(sql`DELETE FROM documents`)
    await db.execute(sql`DELETE FROM costs`)
    await db.execute(sql`DELETE FROM contacts`)
    await db.execute(sql`DELETE FROM projects`) // Must delete before addresses & users
    await db.execute(sql`DELETE FROM sessions`)
    await db.execute(sql`DELETE FROM accounts`)
    await db.execute(sql`DELETE FROM verifications`)
    await db.execute(sql`DELETE FROM addresses`) // Now safe - no projects reference addresses
    await db.execute(sql`DELETE FROM users`) // Now safe - no projects reference users
    // NOTE: Categories are static reference data - don't delete
    // If you need to test category operations, use onConflictDoNothing
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
