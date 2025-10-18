/**
 * Document Category Validation Utility
 *
 * Validates that document category IDs exist before insert operations
 */

import { db } from "./index"
import { categories } from "./schema/categories"
import { eq, and } from "drizzle-orm"

/**
 * Valid predefined document category IDs
 */
export const VALID_DOCUMENT_CATEGORIES = [
  "photos",
  "receipts",
  "invoices",
  "contracts",
  "permits",
  "plans",
  "inspections",
  "warranties",
  "correspondence",
] as const

export type DocumentCategoryId = (typeof VALID_DOCUMENT_CATEGORIES)[number]

/**
 * Validate and normalize document category ID
 *
 * This function:
 * 1. Checks if the category exists in predefined categories
 * 2. Checks if it exists as a custom category in the database
 * 3. Attempts to fix common mistakes (singular vs plural)
 *
 * @param categoryId - The category ID to validate
 * @returns The validated/normalized category ID
 * @throws Error if category doesn't exist and can't be fixed
 */
export async function validateDocumentCategory(categoryId: string): Promise<string> {
  // Check if it's a valid predefined category
  if (VALID_DOCUMENT_CATEGORIES.includes(categoryId as DocumentCategoryId)) {
    return categoryId
  }

  // Check if it's a custom category in the database
  const customCategory = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.type, "document")))
    .limit(1)

  if (customCategory.length > 0) {
    return categoryId
  }

  // Attempt to fix common mistakes: singular → plural
  const singularToPlural: Record<string, string> = {
    photo: "photos",
    receipt: "receipts",
    invoice: "invoices",
    contract: "contracts",
    permit: "permits",
    plan: "plans",
    inspection: "inspections",
    warranty: "warranties",
  }

  const corrected = singularToPlural[categoryId.toLowerCase()]
  if (corrected && VALID_DOCUMENT_CATEGORIES.includes(corrected as DocumentCategoryId)) {
    console.warn(
      `[Document Category] Auto-corrected invalid category "${categoryId}" → "${corrected}"`
    )
    return corrected
  }

  // Category doesn't exist
  throw new Error(
    `Invalid document category "${categoryId}". Valid categories: ${VALID_DOCUMENT_CATEGORIES.join(", ")}`
  )
}

/**
 * Check if a category ID is valid without throwing
 *
 * @param categoryId - The category ID to check
 * @returns true if valid, false otherwise
 */
export async function isValidDocumentCategory(categoryId: string): Promise<boolean> {
  try {
    await validateDocumentCategory(categoryId)
    return true
  } catch {
    return false
  }
}
