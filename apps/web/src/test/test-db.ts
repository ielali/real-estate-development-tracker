import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "../server/db/schema"
import * as fs from "fs"
import * as path from "path"

// Create a dedicated test database connection
export const createTestDb = () => {
  // Ensure data directory exists
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data", { recursive: true })
  }

  // Use a unique test database for this test run
  const testDbPath = `./data/test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }

  // Create fresh test database
  const testDb = new Database(testDbPath)
  testDb.pragma("journal_mode = WAL")
  testDb.pragma("foreign_keys = ON")

  // Apply migration SQL directly to ensure tables are created
  const migrationsPath = "./drizzle"
  const migrationFile = path.join(migrationsPath, "0000_swift_valkyrie.sql")

  if (fs.existsSync(migrationFile)) {
    try {
      const migrationSQL = fs.readFileSync(migrationFile, "utf-8")
      // Remove statement-breakpoint comments and split by semicolon
      const cleanSQL = migrationSQL.replace(/--> statement-breakpoint/g, "")
      const statements = cleanSQL.split(";").filter((stmt) => stmt.trim())

      for (const statement of statements) {
        if (statement.trim()) {
          testDb.exec(statement.trim() + ";")
        }
      }
      console.log("Applied migration SQL directly to test database")
    } catch (sqlError) {
      console.error("Failed to apply migration SQL:", sqlError)
      throw sqlError
    }
  } else {
    console.error("Migration file not found:", migrationFile)
    throw new Error("Migration file not found")
  }

  const db = drizzle(testDb, { schema })

  return {
    db,
    testDb,
    testDbPath,
    cleanup: () => {
      testDb.close()
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath)
        } catch (error) {
          console.warn("Could not remove test database:", error)
        }
      }
    },
  }
}
