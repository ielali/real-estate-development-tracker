import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import * as schema from "../server/db/schema"
import * as path from "path"
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"

let globalContainer: StartedPostgreSqlContainer | null = null
let connectionCount = 0

// Get or create global test container
async function getTestContainer() {
  if (!globalContainer) {
    console.log("🐳 Starting PostgreSQL test container...")
    globalContainer = await new PostgreSqlContainer("postgres:16-alpine").start()
    console.log(`✅ PostgreSQL container started on port ${globalContainer.getPort()}`)
  }
  return globalContainer
}

// Create a dedicated test database connection
export const createTestDb = async () => {
  const container = await getTestContainer()
  connectionCount++

  const connectionString = container.getConnectionUri()
  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql, { schema })

  // Apply migrations
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  })

  return {
    db,
    sql,
    cleanup: async () => {
      await sql.end()
      connectionCount--

      // Stop container when all connections are closed
      if (connectionCount === 0 && globalContainer) {
        console.log("🛑 Stopping PostgreSQL test container...")
        await globalContainer.stop()
        globalContainer = null
      }
    },
  }
}

// Cleanup function for test teardown
export const cleanupAllTestContainers = async () => {
  if (globalContainer) {
    console.log("🧹 Cleaning up test containers...")
    await globalContainer.stop()
    globalContainer = null
    connectionCount = 0
  }
}
