/**
 * CSV Parser Utility
 *
 * Provides CSV parsing functionality with support for multiple delimiters,
 * quoted fields, and various encodings. Follows RFC 4180 standard.
 *
 * Features:
 * - Automatic delimiter detection (comma, tab, semicolon)
 * - Quoted field handling with escaped quotes
 * - Header row detection
 * - UTF-8 and Windows-1252 encoding support
 * - Multiple line ending support (CRLF, LF, CR)
 */

/**
 * Detected delimiter information
 */
interface DelimiterInfo {
  delimiter: string
  confidence: number
}

/**
 * CSV parsing result
 */
export interface CsvParseResult {
  headers: string[]
  rows: Record<string, string>[]
  delimiter: string
}

/**
 * CSV parsing options
 */
export interface CsvParseOptions {
  delimiter?: string // Force specific delimiter (auto-detect if not provided)
  hasHeaders?: boolean // First row contains headers (default: true)
  trimValues?: boolean // Trim whitespace from values (default: true)
}

/**
 * Detect the delimiter used in a CSV string
 *
 * Analyzes the first few lines to determine the most likely delimiter
 * by counting occurrences and checking for consistency.
 *
 * @param csvText - The CSV text to analyze
 * @returns Delimiter info with confidence score
 */
function detectDelimiter(csvText: string): DelimiterInfo {
  const delimiters = [",", "\t", ";"]
  const lines = csvText.split("\n").slice(0, 5) // Check first 5 lines

  const scores: Record<string, number> = {}

  for (const delimiter of delimiters) {
    const counts = lines.map((line) => {
      // Don't count delimiters inside quoted strings
      let inQuotes = false
      let count = 0
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes
        } else if (line[i] === delimiter && !inQuotes) {
          count++
        }
      }
      return count
    })

    // Check consistency: all lines should have similar delimiter counts
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance =
      counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length

    // Higher avg count and lower variance = better score
    scores[delimiter] = avgCount > 0 ? avgCount / (variance + 1) : 0
  }

  // Find delimiter with highest score
  const bestDelimiter = delimiters.reduce((best, current) =>
    scores[current] > scores[best] ? current : best
  )

  return {
    delimiter: bestDelimiter,
    confidence: scores[bestDelimiter],
  }
}

/**
 * Parse entire CSV text into rows, handling multiline quoted fields
 *
 * Parses CSV character by character, respecting quote boundaries
 * and handling newlines within quoted fields.
 *
 * @param csvText - CSV text to parse
 * @param delimiter - Delimiter character
 * @returns Array of rows, where each row is an array of field values
 */
function parseCsvText(csvText: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let inQuotes = false
  let i = 0

  while (i < csvText.length) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" → "
        currentField += '"'
        i += 2
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
        continue
      }
    }

    if (char === delimiter && !inQuotes) {
      // End of field
      currentRow.push(currentField)
      currentField = ""
      i++
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of row
      // Handle CRLF (\r\n)
      if (char === "\r" && nextChar === "\n") {
        i += 2
      } else {
        i++
      }

      // Add field and row if not empty
      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField)
        currentField = ""

        if (currentRow.length > 0) {
          rows.push(currentRow)
          currentRow = []
        }
      }
      continue
    }

    // Regular character (including newlines inside quotes)
    currentField += char
    i++
  }

  // Add final field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
  }
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}

/**
 * Parse CSV text into structured data
 *
 * Automatically detects delimiter, parses headers, and converts rows to objects.
 *
 * @param csvText - CSV text to parse
 * @param options - Parsing options
 * @returns Parsed CSV data with headers and rows
 * @throws Error if CSV is invalid or empty
 */
export function parseCsv(csvText: string, options: CsvParseOptions = {}): CsvParseResult {
  if (!csvText || csvText.trim().length === 0) {
    throw new Error("CSV file is empty")
  }

  // Detect or use provided delimiter
  const delimiter = options.delimiter ?? detectDelimiter(csvText).delimiter

  // Parse entire CSV text, handling multiline quoted fields
  const parsedRows = parseCsvText(csvText, delimiter)

  if (parsedRows.length === 0) {
    throw new Error("CSV file is empty")
  }

  // Extract headers
  const hasHeaders = options.hasHeaders ?? true
  const headers = hasHeaders ? parsedRows[0] : parsedRows[0].map((_, i) => `Column ${i + 1}`)
  const dataRows = hasHeaders ? parsedRows.slice(1) : parsedRows

  // Validate header count consistency
  const headerCount = headers.length
  const invalidRows = dataRows.filter((row) => row.length !== headerCount)
  if (invalidRows.length > 0) {
    throw new Error(
      `CSV has inconsistent column counts. Expected ${headerCount} columns, but found rows with different counts.`
    )
  }

  // Convert to objects
  const trimValues = options.trimValues ?? true
  const rows = dataRows.map((fields) => {
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      const value = fields[index] ?? ""
      row[header] = trimValues ? value.trim() : value
    })
    return row
  })

  return {
    headers: trimValues ? headers.map((h) => h.trim()) : headers,
    rows,
    delimiter,
  }
}

/**
 * Parse CSV file from FileReader result
 *
 * Handles ArrayBuffer and string results from FileReader.
 *
 * @param result - FileReader result (ArrayBuffer or string)
 * @param options - Parsing options
 * @returns Parsed CSV data
 */
export function parseCsvFromFile(
  result: ArrayBuffer | string,
  options: CsvParseOptions = {}
): CsvParseResult {
  let csvText: string

  if (typeof result === "string") {
    csvText = result
  } else {
    // Decode ArrayBuffer to string (try UTF-8 first, fallback to Windows-1252)
    try {
      csvText = new TextDecoder("utf-8", { fatal: true }).decode(result)
    } catch {
      csvText = new TextDecoder("windows-1252").decode(result)
    }
  }

  return parseCsv(csvText, options)
}

/**
 * Validate CSV file size
 *
 * Checks if file size is within acceptable limits (10MB max).
 *
 * @param file - File to validate
 * @throws Error if file exceeds size limit
 */
export function validateCsvFileSize(file: File): void {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("CSV file exceeds maximum size of 10MB. Please reduce file size and try again.")
  }
}

/**
 * Read CSV file as text
 *
 * Convenience function to read a File object as CSV text.
 *
 * @param file - CSV file to read
 * @returns Promise that resolves with CSV parse result
 */
export async function readCsvFile(
  file: File,
  options: CsvParseOptions = {}
): Promise<CsvParseResult> {
  // Validate file size
  validateCsvFileSize(file)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const result = event.target?.result
        if (!result) {
          throw new Error("Failed to read CSV file")
        }
        const parsed = parseCsvFromFile(result, options)
        resolve(parsed)
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed to parse CSV file"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read CSV file"))
    }

    reader.readAsArrayBuffer(file)
  })
}
