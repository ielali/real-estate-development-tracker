import { db } from "./index"
import { sql } from "drizzle-orm"
import * as fs from "fs"
import { execSync } from "child_process"

async function reset() {
  console.log("🔄 Starting database reset...")

  try {
    const dbPath = (process.env.DATABASE_URL || "file:./dev.db").replace("file:", "")

    console.log("Closing database connections...")
    await db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`)

    console.log("Removing database file...")
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
    if (fs.existsSync(`${dbPath}-shm`)) {
      fs.unlinkSync(`${dbPath}-shm`)
    }
    if (fs.existsSync(`${dbPath}-wal`)) {
      fs.unlinkSync(`${dbPath}-wal`)
    }

    console.log("Running migrations...")
    execSync("npx tsx src/server/db/migrate.ts", { stdio: "inherit" })

    console.log("Running seed...")
    execSync("npx tsx src/server/db/seed.ts", { stdio: "inherit" })

    console.log("✅ Database reset completed successfully!")
  } catch (error) {
    console.error("❌ Reset failed:", error)
    process.exit(1)
  }
}

reset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
