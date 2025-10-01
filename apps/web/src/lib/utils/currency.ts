/**
 * Currency formatting utilities
 */

/**
 * Formats a numeric string input with thousand separators
 * Handles decimal points and removes invalid characters
 *
 * @param value - Raw input value
 * @returns Formatted string with commas as thousand separators
 *
 * @example
 * formatCurrencyInput("1234.56") // "1,234.56"
 * formatCurrencyInput("1234567") // "1,234,567"
 */
export function formatCurrencyInput(value: string): string {
  // Remove all non-digit and non-decimal characters
  let cleaned = value.replace(/[^\d.]/g, "")

  // Ensure only one decimal point
  const parts = cleaned.split(".")
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("")
  }

  // Format with thousand separators for display
  if (cleaned) {
    const [integer, decimal] = cleaned.split(".")
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger
  }

  return cleaned
}

/**
 * Removes formatting from currency string to get raw numeric value
 *
 * @param value - Formatted currency string
 * @returns Clean numeric string
 *
 * @example
 * parseCurrencyInput("1,234.56") // "1234.56"
 * parseCurrencyInput("$1,234") // "1234"
 */
export function parseCurrencyInput(value: string): string {
  return value.replace(/[^\d.]/g, "")
}

/**
 * Converts dollars to cents (integer)
 *
 * @param dollars - Dollar amount as string or number
 * @returns Amount in cents
 *
 * @example
 * dollarsToCents("1234.56") // 123456
 * dollarsToCents(1234.56) // 123456
 */
export function dollarsToCents(dollars: string | number): number {
  const cleaned = typeof dollars === "string" ? parseCurrencyInput(dollars) : dollars.toString()
  return Math.round(parseFloat(cleaned) * 100)
}

/**
 * Converts cents to dollars (with decimal)
 *
 * @param cents - Amount in cents
 * @returns Dollar amount as string with 2 decimal places
 *
 * @example
 * centsToDollars(123456) // "1234.56"
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}
