import * as fs from "fs"
import * as path from "path"
import { db } from "./index"
import { sql } from "drizzle-orm"

async function backup() {
  console.log("💾 Starting database backup...")

  try {
    const dbPath = (process.env.DATABASE_URL || "file:./dev.db").replace("file:", "")
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -1)
    const backupDir = path.join(process.cwd(), "backups")
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`)

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    console.log("Creating checkpoint...")
    await db.run(sql`PRAGMA wal_checkpoint(FULL)`)

    console.log(`Creating backup at: ${backupPath}`)
    fs.copyFileSync(dbPath, backupPath)

    const stats = fs.statSync(backupPath)
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

    console.log(`✅ Backup completed successfully!`)
    console.log(`   File: ${backupPath}`)
    console.log(`   Size: ${sizeInMB} MB`)
  } catch (error) {
    console.error("❌ Backup failed:", error)
    process.exit(1)
  }
}

backup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
