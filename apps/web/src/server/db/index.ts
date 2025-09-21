import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import * as fs from "fs"
import * as path from "path"

const dbUrl = process.env.DATABASE_URL || "file:./dev.db"
const dbPath = dbUrl.replace("file:", "")

const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir) && dbDir !== ".") {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)

sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

export const db = drizzle(sqlite, { schema })

export type Database = typeof db

export * from "./schema"
export * from "./types"
