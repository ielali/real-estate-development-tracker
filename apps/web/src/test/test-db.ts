import * as schema from "../server/db/schema"
import { categories } from "../server/db/schema/categories"
import { CATEGORIES } from "../server/db/types"
import { sql } from "drizzle-orm"
import { getDatabaseUrl } from "@/server/db/get-database-url"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalPool: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalDb: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalClient: any = null
let categoriesSeeded = false

// Get test database URL from environment
function getTestDbUrl(): string {
  return getDatabaseUrl()
}

/**
 * Create a test database connection with driver abstraction.
 *
 * IMPORTANT: This assumes:
 * 1. Database exists and is migrated
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
  const driver = process.env.DATABASE_DRIVER || "neon"

  // Create new connection if needed
  if (!globalPool && !globalClient && !globalDb) {
    if (driver === "postgresql") {
      // Use standard PostgreSQL driver for local testing
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const postgresModule = require("postgres")
      const postgres = postgresModule.default || postgresModule
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { drizzle } = require("drizzle-orm/postgres-js")

      globalClient = postgres(dbUrl)
      globalDb = drizzle(globalClient, { schema })
    } else {
      // Use Neon serverless driver
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { drizzle } = require("drizzle-orm/neon-serverless")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Pool, neonConfig } = require("@neondatabase/serverless")
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ws = require("ws")

      // Configure Neon WebSocket for Node.js environment
      if (typeof WebSocket === "undefined") {
        neonConfig.webSocketConstructor = ws
      }

      globalPool = new Pool({ connectionString: dbUrl })
      globalDb = drizzle(globalPool, { schema })
    }
  }

  // Seed categories if not already seeded
  // Categories are static reference data that persist across tests
  if (!categoriesSeeded) {
    // Check if categories already exist in the database
    const existingCategories = await globalDb
      .select({ count: sql<number>`count(*)` })
      .from(categories)

    if (Number(existingCategories[0]?.count) === 0) {
      // No categories exist, insert them all at once
      await globalDb.insert(categories).values(CATEGORIES)
    }
    categoriesSeeded = true
  }

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCleanupFunction(db: any) {
  return async () => {
    // TRUNCATE CASCADE automatically handles foreign key dependencies
    // Much more reliable than manual DELETE ordering
    // NOTE: categories table is excluded - it contains static reference data that's seeded once
    await db.execute(sql`
      TRUNCATE TABLE
        audit_log,
        cost_documents,
        contact_documents,
        event_documents,
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
  }
  if (globalClient) {
    await globalClient.end()
    globalClient = null
  }
  globalDb = null
}

/**
 * Create a test tRPC context with a mocked user and session
 *
 * Story 4.2: Enhanced to support role-based testing
 *
 * @param options - Configuration options
 * @param options.role - User role ("admin" | "partner"), defaults to "admin"
 * @param options.user - Optional custom user object, or null for unauthenticated tests
 * @returns tRPC context for testing
 *
 * @example
 * ```typescript
 * // Admin context
 * const ctx = await createTestContext({ role: "admin" })
 *
 * // Partner context
 * const ctx = await createTestContext({ role: "partner" })
 *
 * // Unauthenticated context
 * const ctx = await createTestContext({ user: null })
 * ```
 */
export async function createTestContext(
  options: {
    role?: "admin" | "partner"
    user?: { id: string; email: string; role: "admin" | "partner" } | null
  } = {}
) {
  const { db } = await createTestDb()

  // Handle unauthenticated case
  if (options.user === null) {
    return {
      db,
      session: null,
      user: null,
      headers: new Headers(),
    }
  }

  // Use provided user or create default test user
  const testUser = options.user || {
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    role: options.role || "admin",
  }

  // Insert test user into database if not exists
  const { users } = await import("@/server/db/schema")
  await db
    .insert(users)
    .values({
      id: testUser.id,
      email: testUser.email,
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      role: testUser.role,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()

  return {
    db,
    session: {
      session: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        token: `test-token-${crypto.randomUUID()}`,
        ipAddress: "127.0.0.1",
        userAgent: "test",
      },
      user: {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        name: "Test User",
        image: null,
      },
    },
    user: {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      name: "Test User",
      image: null,
    },
    headers: new Headers(),
  }
}
