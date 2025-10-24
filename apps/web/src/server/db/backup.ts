import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"
import dotenv from "dotenv"

// Load environment variables from .env file (only for local development)
// In Netlify, environment variables are injected automatically
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(process.cwd(), ".env") })
}

const execAsync = promisify(exec)

async function backup() {
  console.log("💾 Starting database backup...")

  try {
    import { getDatabaseUrl } from "./get-database-url"
    const dbUrl = getDatabaseUrl()

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -1)
    const backupDir = path.join(process.cwd(), "backups")
    const backupPath = path.join(backupDir, `backup-${timestamp}.sql`)

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    console.log(`Creating backup at: ${backupPath}`)

    // Use pg_dump to create PostgreSQL backup
    const { stdout } = await execAsync(`pg_dump "${dbUrl}" -f "${backupPath}"`)

    if (stdout) console.log(stdout)

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
