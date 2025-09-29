import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import * as fs from "fs"
import * as path from "path"

// Determine database URL based on environment
const getDbUrl = (): string => {
  if (process.env.NODE_ENV === "test") {
    return process.env.DATABASE_URL || `file:${path.join(process.cwd(), "data", "test.db")}`
  }
  return process.env.DATABASE_URL || `file:${path.join(process.cwd(), "data", "dev.db")}`
}

// Create database connection function for better test isolation
const createDatabase = () => {
  const dbUrl = getDbUrl()
  const dbPath = dbUrl.replace("file:", "")

  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir) && dbDir !== ".") {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const sqlite = new Database(dbPath)

  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")

  return drizzle(sqlite, { schema })
}

export const db = createDatabase()

// Export database path for cleanup purposes (useful in tests)
export const exportedDbPath = getDbUrl().replace("file:", "")

export type Database = typeof db

export * from "./schema"
export * from "./types"
