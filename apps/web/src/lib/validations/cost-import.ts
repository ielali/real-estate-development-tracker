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
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    // Validate ranges
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      throw new Error(`Invalid date format: ${dateString}`)
    }

    const isoDate = new Date(yearNum, monthNum - 1, dayNum)
    if (isValid(isoDate) && isoDate.getMonth() === monthNum - 1 && isoDate.getDate() === dayNum) {
      return isoDate
    }
  }

  // Detect format by first number for MM/DD vs DD/MM ambiguity
  const slashMatch = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/)
  if (slashMatch) {
    const [_, first, second, year] = slashMatch
    const firstNum = parseInt(first)
    const secondNum = parseInt(second)
    const yearNum = parseInt(year)

    // Validate basic ranges
    if (firstNum < 1 || secondNum < 1 || firstNum > 31 || secondNum > 31) {
      throw new Error(`Invalid date format: ${dateString}`)
    }

    // If first number > 12, must be DD/MM/YYYY
    if (firstNum > 12) {
      if (secondNum > 12) {
        throw new Error(`Invalid date format: ${dateString}`)
      }
      const ddMMDate = new Date(yearNum, secondNum - 1, firstNum)
      if (
        isValid(ddMMDate) &&
        ddMMDate.getMonth() === secondNum - 1 &&
        ddMMDate.getDate() === firstNum
      ) {
        return ddMMDate
      }
    }

    // If second number > 12, must be MM/DD/YYYY
    if (secondNum > 12) {
      const mmDDDate = new Date(yearNum, firstNum - 1, secondNum)
      if (
        isValid(mmDDDate) &&
        mmDDDate.getMonth() === firstNum - 1 &&
        mmDDDate.getDate() === secondNum
      ) {
        return mmDDDate
      }
    }

    // Both numbers ≤ 12: ambiguous. Try MM/DD/YYYY first (US format default)
    const mmDDDate = new Date(yearNum, firstNum - 1, secondNum)
    if (
      isValid(mmDDDate) &&
      mmDDDate.getMonth() === firstNum - 1 &&
      mmDDDate.getDate() === secondNum
    ) {
      return mmDDDate
    }

    // Fallback to DD/MM/YYYY
    const ddMMDate = new Date(yearNum, secondNum - 1, firstNum)
    if (
      isValid(ddMMDate) &&
      ddMMDate.getMonth() === secondNum - 1 &&
      ddMMDate.getDate() === firstNum
    ) {
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
  const europeanWithDecimal = str.match(/\d+\.\d{3},\d{1,2}$/)
  // European no decimal: 1-3 digits, then period, then exactly 3 digits (e.g., "10.005")
  // But NOT 4+ digits before period (e.g., "1500.555" is decimal, not European)
  const europeanNoDecimal = str.match(/^\d{1,3}\.\d{3}$/)
  const usFormat = str.match(/\d+,\d{3}(?:\.\d{1,2})?$/)

  let cleaned: string

  if (europeanWithDecimal) {
    // European format: replace periods (thousands) and convert comma to period (decimal)
    cleaned = str.replace(/\./g, "").replace(",", ".")
  } else if (europeanNoDecimal) {
    // European thousand separator only, no decimal: "10.005" -> "10005"
    cleaned = str.replace(/\./g, "")
  } else if (usFormat) {
    // US format: remove commas (thousands), keep period (decimal)
    cleaned = str.replace(/,/g, "")
  } else {
    // Simple number or already cleaned (includes decimals like "1500.555")
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

  // Second pass: Look for word boundary matches (most specific)
  // Collect all word boundary matches and choose the best one
  const wordMatches: Array<{ field: string; alias: string; index: number }> = []
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (const alias of aliases) {
      if (alias.length < 3) continue // Skip short aliases
      // Create regex for word boundary match (separated by _, -, space, or at start/end)
      const wordBoundaryRegex = new RegExp(`(^|[_\\s-])${alias}([_\\s-]|$)`)
      const match = normalizedHeader.match(wordBoundaryRegex)
      if (match) {
        wordMatches.push({
          field,
          alias,
          index: match.index ?? 0,
        })
      }
    }
  }

  // If we have word boundary matches, pick the best one
  // Prefer: 1) Rightmost position (for compound headers like "expense_amount"), 2) Longest alias
  if (wordMatches.length > 0) {
    wordMatches.sort((a, b) => {
      // First priority: rightmost position in header
      if (a.index !== b.index) {
        return b.index - a.index
      }
      // Second priority: longest alias
      return b.alias.length - a.alias.length
    })
    return wordMatches[0].field
  }

  // Third pass: Look for headers that contain the alias (fuzzy match)
  // Create flat list of (field, alias) pairs and sort by alias length (longest first)
  const fieldAliasPairs: Array<[string, string]> = []
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (const alias of aliases) {
      if (alias.length >= 3) {
        // Only include aliases >= 3 chars
        fieldAliasPairs.push([field, alias])
      }
    }
  }

  // Sort by alias length descending (longest/most specific first)
  fieldAliasPairs.sort((a, b) => b[1].length - a[1].length)

  // Check each alias in order of specificity
  for (const [field, alias] of fieldAliasPairs) {
    if (normalizedHeader.includes(alias)) {
      return field
    }
  }

  return null // User must manually map
}
