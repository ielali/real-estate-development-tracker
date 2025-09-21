import { db, users } from "./index"
import { count } from "drizzle-orm"

async function testConnection() {
  try {
    console.log("Testing database connection...")

    const [result] = await db.select({ total: count() }).from(users)

    console.log("✅ Database connection successful!")
    console.log(`Total users in database: ${result.total}`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  }
}

testConnection()
