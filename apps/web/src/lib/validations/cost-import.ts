import { z } from "zod"
import { parse, isValid } from "date-fns"

/**
 * Cost Import Validation Schemas
 *
 * Provides validation for CSV import of cost entries with support for:
 * - Multiple date formats
 * - Various amount formats (currency symbols, separators)
 * - Special characters and unicode
 * - Required and optional fields
 */

/**
 * Supported date formats for CSV import
 */
const DATE_FORMATS = [
  "yyyy-MM-dd", // ISO: 2024-01-15
  "MM/dd/yyyy", // US: 01/15/2024
  "M/d/yyyy", // US short: 1/15/2024
  "dd/MM/yyyy", // EU: 15/01/2024
  "d/M/yyyy", // EU short: 15/1/2024
  "dd.MM.yyyy", // EU dot: 15.01.2024
  "yyyy/MM/dd", // ISO slash: 2024/01/15
  "MMMM dd, yyyy", // Long: January 15, 2024
  "dd MMM yyyy", // Short: 15 Jan 2024
  "MMM dd, yyyy", // US long: Jan 15, 2024
]

/**
 * Parse date string with automatic format detection
 *
 * Tries multiple date formats in order of likelihood. Handles ambiguous dates
 * by assuming MM/DD/YYYY for values where first number ≤ 12, otherwise DD/MM/YYYY.
 *
 * @param dateString - Date string from CSV
 * @returns Parsed Date object
 * @throws Error if date cannot be parsed
 */
export function parseDate(dateString: string): Date {
  const trimmed = dateString.trim()

  // Try ISO-8601 first (YYYY-MM-DD or YYYY/MM/DD) - unambiguous
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (isoMatch) {
    const [_, year, month, day] = isoMatch
    const isoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (isValid(isoDate)) {
      return isoDate
    }
  }

  // Detect format by first number for MM/DD vs DD/MM ambiguity
  const slashMatch = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/)
  if (slashMatch) {
    const [_, first, second, year] = slashMatch
    const firstNum = parseInt(first)
    const secondNum = parseInt(second)

    // If first number > 12, must be DD/MM/YYYY
    if (firstNum > 12) {
      const ddMMDate = new Date(parseInt(year), secondNum - 1, firstNum)
      if (isValid(ddMMDate)) {
        return ddMMDate
      }
    }

    // If second number > 12, must be MM/DD/YYYY
    if (secondNum > 12) {
      const mmDDDate = new Date(parseInt(year), firstNum - 1, secondNum)
      if (isValid(mmDDDate)) {
        return mmDDDate
      }
    }

    // Both numbers ≤ 12: ambiguous. Try MM/DD/YYYY first (US format default)
    const mmDDDate = new Date(parseInt(year), firstNum - 1, secondNum)
    if (isValid(mmDDDate)) {
      return mmDDDate
    }

    // Fallback to DD/MM/YYYY
    const ddMMDate = new Date(parseInt(year), secondNum - 1, firstNum)
    if (isValid(ddMMDate)) {
      return ddMMDate
    }
  }

  // Try all formats
  for (const format of DATE_FORMATS) {
    const parsed = parse(trimmed, format, new Date())
    if (isValid(parsed)) {
      return parsed
    }
  }

  throw new Error(`Invalid date format: ${dateString}`)
}

/**
 * Parse amount string with currency symbol and separator handling
 *
 * Supports:
 * - Currency symbols: $, €, £, ¥, AUD
 * - Thousands separators: comma, space, period (European)
 * - Decimal separators: period (US) or comma (European)
 * - Parentheses for negative amounts: ($1,500.00)
 *
 * @param amountString - Amount string from CSV
 * @returns Amount in cents (integer)
 * @throws Error if amount cannot be parsed
 */
export function parseAmount(amountString: string): number {
  let str = amountString.trim()

  // Check for negative (parentheses or minus sign)
  let isNegative = false
  if (str.startsWith("(") && str.endsWith(")")) {
    isNegative = true
    str = str.slice(1, -1).trim()
  } else if (str.startsWith("-")) {
    isNegative = true
    str = str.slice(1).trim()
  }

  // Remove currency symbols and currency codes
  str = str.replace(/^(AUD|USD|EUR|GBP|JPY)\s*/i, "") // Currency codes
  str = str.replace(/[$€£¥]/g, "") // Currency symbols

  // Remove whitespace
  str = str.replace(/\s/g, "")

  // Detect European format (1.500,00) vs US format (1,500.00)
  // European: period for thousands, comma for decimal
  // US: comma for thousands, period for decimal
  const europeanFormat = str.match(/\d+\.\d{3}(?:,\d{1,2})?$/)
  const usFormat = str.match(/\d+,\d{3}(?:\.\d{1,2})?$/)

  let cleaned: string

  if (europeanFormat) {
    // European format: replace periods (thousands) and convert comma to period (decimal)
    cleaned = str.replace(/\./g, "").replace(",", ".")
  } else if (usFormat) {
    // US format: remove commas (thousands), keep period (decimal)
    cleaned = str.replace(/,/g, "")
  } else {
    // Simple number or already cleaned
    cleaned = str.replace(/,/g, "") // Remove any remaining commas
  }

  // Parse as float
  const amount = parseFloat(cleaned)

  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountString}`)
  }

  // Apply negative sign if needed
  const finalAmount = isNegative ? -amount : amount

  // Convert to cents (integer) to avoid floating point precision issues
  return Math.round(finalAmount * 100)
}

/**
 * Standardized error messages for validation
 */
export const ERROR_MESSAGES = {
  INVALID_DATE: (value: string) =>
    `Invalid date format "${value}". Expected YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY`,

  INVALID_AMOUNT: (value: string) =>
    `Invalid amount "${value}". Expected number or currency format (e.g., 1500.00 or $1,500.00)`,

  NEGATIVE_AMOUNT: () => `Amount must be positive`,

  MISSING_REQUIRED: (field: string) => `Missing required field "${field}"`,

  DESCRIPTION_TOO_LONG: (length: number) =>
    `Description exceeds maximum length (${length}/500 characters)`,

  NOTES_TOO_LONG: (length: number) => `Notes exceed maximum length (${length}/1000 characters)`,
}

/**
 * Schema for a single cost row from CSV import
 *
 * Validates:
 * - Required fields: date, description, amount, category
 * - Optional fields: vendor, notes
 * - Field lengths and formats
 */
export const importCostRowSchema = z.object({
  date: z.string().refine(
    (val) => {
      try {
        parseDate(val)
        return true
      } catch {
        return false
      }
    },
    (val) => ({ message: ERROR_MESSAGES.INVALID_DATE(val) })
  ),

  description: z
    .string()
    .min(1, ERROR_MESSAGES.MISSING_REQUIRED("description"))
    .max(500, "Description exceeds maximum length of 500 characters")
    .refine((val) => val.trim().length > 0, {
      message: ERROR_MESSAGES.MISSING_REQUIRED("description"),
    }),

  amount: z.string().refine(
    (val) => {
      try {
        const parsed = parseAmount(val)
        return parsed > 0
      } catch {
        return false
      }
    },
    (val) => {
      try {
        const parsed = parseAmount(val)
        if (parsed <= 0) {
          return { message: ERROR_MESSAGES.NEGATIVE_AMOUNT() }
        }
      } catch {
        // Parsing failed
      }
      return { message: ERROR_MESSAGES.INVALID_AMOUNT(val) }
    }
  ),

  category: z
    .string()
    .min(1, ERROR_MESSAGES.MISSING_REQUIRED("category"))
    .max(100, "Category exceeds maximum length of 100 characters"),

  vendor: z
    .string()
    .max(200, "Vendor exceeds maximum length of 200 characters")
    .optional()
    .default(""),

  notes: z
    .string()
    .max(1000, "Notes exceed maximum length of 1000 characters")
    .optional()
    .default(""),
})

/**
 * Type inference for validated cost row
 */
export type ImportCostRow = z.infer<typeof importCostRowSchema>

/**
 * Column mapping from CSV headers to database fields
 */
export const columnMappingSchema = z.record(z.string(), z.string())

/**
 * Schema for the complete import costs request
 */
export const importCostsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  rows: z.array(importCostRowSchema).min(1, "At least one cost entry is required"),
  columnMappings: columnMappingSchema,
  createNewVendors: z.boolean().default(true),
  createNewCategories: z.boolean().default(false),
})

/**
 * Type inference for import costs request
 */
export type ImportCostsInput = z.infer<typeof importCostsSchema>

/**
 * Schema for validate import request (preview before execution)
 */
export const validateImportSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  rows: z.array(z.record(z.string(), z.string())), // Raw CSV rows (not yet validated)
  columnMappings: columnMappingSchema,
})

/**
 * Type inference for validate import request
 */
export type ValidateImportInput = z.infer<typeof validateImportSchema>

/**
 * Validation error for a specific row and field
 */
export interface ValidationError {
  lineNumber: number
  field: string
  message: string
  value: string
}

/**
 * Result of import validation
 */
export interface ValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  errorRows: number
  errors: ValidationError[]
  matchedVendors: Array<{ name: string; contactId: string }>
  unmatchedVendors: string[]
  matchedCategories: Array<{ name: string; categoryId: string }>
  unmatchedCategories: string[]
}

/**
 * Auto-detection mappings for CSV columns to database fields
 */
export const COLUMN_MAPPINGS: Record<string, string[]> = {
  date: ["date", "transaction date", "payment date", "invoice date", "trans date", "cost date"],
  description: ["description", "desc", "details", "item", "memo", "note", "purpose", "expense"],
  amount: ["amount", "cost", "price", "total", "value", "sum", "expense", "spent"],
  category: ["category", "type", "classification", "class", "group", "expense type"],
  vendor: [
    "vendor",
    "supplier",
    "company",
    "contractor",
    "payee",
    "merchant",
    "contact",
    "paid to",
  ],
  notes: ["notes", "comments", "remarks", "memo", "additional notes", "description 2"],
}

/**
 * Detect column mapping from CSV header
 *
 * Case-insensitive matching against known field aliases.
 * Prioritizes exact matches, then checks if header contains alias.
 * Empty headers return null.
 *
 * @param header - CSV column header
 * @returns Detected database field name or null if not matched
 */
export function detectColumnMapping(header: string): string | null {
  const normalizedHeader = header.toLowerCase().trim()

  // Return null for empty headers
  if (normalizedHeader.length === 0) {
    return null
  }

  // First pass: Look for exact matches
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some((alias) => normalizedHeader === alias)) {
      return field
    }
  }

  // Second pass: Look for headers that contain the alias (fuzzy match)
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some((alias) => normalizedHeader.includes(alias))) {
      return field
    }
  }

  return null // User must manually map
}
