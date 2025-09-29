import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as path from "path"
import * as fs from "fs"

const dbUrl = process.env.DATABASE_URL || "file:./data/dev.db"
const dbPath = dbUrl.replace("file:", "")

const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir) && dbDir !== ".") {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

async function main() {
  console.log("Running migrations...")

  migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  })

  console.log("Migrations completed successfully!")
  sqlite.close()
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
