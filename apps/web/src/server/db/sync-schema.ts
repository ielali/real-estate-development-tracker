/**
 * Schema Sync Utility
 *
 * Automatically adds missing columns that exist in the Drizzle schema
 * but are missing from the database. This ensures the database matches
 * the schema definition without requiring manual migrations for every
 * schema change.
 *
 * This is particularly useful for:
 * - Test databases that need to be recreated frequently
 * - Development environments where schema changes happen frequently
 * - Ensuring schema consistency after migrations
 */

import { db } from "./index"
import { sql } from "drizzle-orm"

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
      AND column_name = ${columnName}
    ) as exists
  `)
  return (result[0] as { exists: boolean })?.exists ?? false
}

/**
 * Add a column to a table if it doesn't exist
 */
async function addColumnIfMissing(
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  const exists = await columnExists(tableName, columnName)
  if (!exists) {
    await db.execute(
      sql.raw(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnDefinition}`)
    )
    console.log(`     ✓ Added ${tableName}.${columnName} column`)
  } else {
    console.log(`     ✓ ${tableName}.${columnName} column already exists`)
  }
}

/**
 * Sync users table schema - adds missing columns
 */
async function syncUsersTable() {
  console.log("   Syncing users table...")
  await addColumnIfMissing("users", "two_factor_enabled", "boolean DEFAULT false")
}

/**
 * Sync projects table schema - adds missing columns
 */
async function syncProjectsTable() {
  console.log("   Syncing projects table...")
  await addColumnIfMissing("projects", "size", "bigint")
  await addColumnIfMissing("projects", "search_vector", "tsvector")
}

/**
 * Sync contacts table schema - adds missing columns
 */
async function syncContactsTable() {
  console.log("   Syncing contacts table...")
  await addColumnIfMissing("contacts", "search_vector", "tsvector")
}

/**
 * Sync costs table schema - adds missing columns
 */
async function syncCostsTable() {
  console.log("   Syncing costs table...")
  await addColumnIfMissing("costs", "search_vector", "tsvector")
}

/**
 * Sync documents table schema - adds missing columns
 */
async function syncDocumentsTable() {
  console.log("   Syncing documents table...")
  await addColumnIfMissing("documents", "search_vector", "tsvector")
}

/**
 * Main sync function - adds all missing columns from schema
 */
export async function syncSchema() {
  console.log("\n🔧 Syncing database schema with Drizzle definitions...")

  try {
    await syncUsersTable()
    await syncProjectsTable()
    await syncContactsTable()
    await syncCostsTable()
    await syncDocumentsTable()
    // Add more table syncs here as needed

    console.log("   ✅ Schema sync completed!")
  } catch (error) {
    console.error("   ❌ Schema sync failed:", error)
    throw error
  }
}
