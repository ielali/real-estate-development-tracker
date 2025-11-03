import { describe, it, expect } from "vitest"
import {
  parseDate,
  parseAmount,
  importCostRowSchema,
  detectColumnMapping,
  ERROR_MESSAGES,
} from "../cost-import"

describe("cost-import validation", () => {
  describe("parseDate", () => {
    it("parses ISO-8601 format (YYYY-MM-DD)", () => {
      const date = parseDate("2024-01-15")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January (0-indexed)
      expect(date.getDate()).toBe(15)
    })

    it("parses ISO format with slashes (YYYY/MM/DD)", () => {
      const date = parseDate("2024/01/15")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses US format (MM/DD/YYYY)", () => {
      const date = parseDate("01/15/2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses US short format (M/D/YYYY)", () => {
      const date = parseDate("1/15/2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses EU format (DD/MM/YYYY) when day > 12", () => {
      const date = parseDate("15/01/2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses EU format with dots (DD.MM.YYYY)", () => {
      const date = parseDate("15.01.2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses long format (MMMM DD, YYYY)", () => {
      const date = parseDate("January 15, 2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("parses short format (DD MMM YYYY)", () => {
      const date = parseDate("15 Jan 2024")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("handles ambiguous dates (01/02/2024) as MM/DD/YYYY", () => {
      // When both numbers ≤ 12, defaults to MM/DD/YYYY (US format)
      const date = parseDate("01/02/2024")
      expect(date.getMonth()).toBe(0) // January
      expect(date.getDate()).toBe(2)
    })

    it("detects DD/MM when day > 12", () => {
      const date = parseDate("25/12/2024")
      expect(date.getMonth()).toBe(11) // December
      expect(date.getDate()).toBe(25)
    })

    it("detects MM/DD when month > 12", () => {
      const date = parseDate("12/25/2024")
      expect(date.getMonth()).toBe(11) // December
      expect(date.getDate()).toBe(25)
    })

    it("trims whitespace", () => {
      const date = parseDate("  2024-01-15  ")
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })

    it("throws error for invalid date", () => {
      expect(() => parseDate("not-a-date")).toThrow("Invalid date format: not-a-date")
      expect(() => parseDate("2024-13-45")).toThrow("Invalid date format")
      expect(() => parseDate("99/99/9999")).toThrow("Invalid date format")
    })

    it("throws error for empty string", () => {
      expect(() => parseDate("")).toThrow("Invalid date format")
    })
  })

  describe("parseAmount", () => {
    it("parses plain integer", () => {
      expect(parseAmount("1500")).toBe(150000) // 1500 * 100 cents
    })

    it("parses plain decimal", () => {
      expect(parseAmount("1500.50")).toBe(150050) // 1500.50 * 100 cents
    })

    it("parses amount with dollar sign", () => {
      expect(parseAmount("$1500.00")).toBe(150000)
    })

    it("parses amount with comma thousands separator (US format)", () => {
      expect(parseAmount("$1,500.00")).toBe(150000)
      expect(parseAmount("10,000.50")).toBe(1000050)
    })

    it("parses amount with period thousands separator (EU format)", () => {
      expect(parseAmount("1.500,00")).toBe(150000)
      expect(parseAmount("10.000,50")).toBe(1000050)
    })

    it("parses amount with space thousands separator", () => {
      expect(parseAmount("1 500.00")).toBe(150000)
      expect(parseAmount("10 000.50")).toBe(1000050)
    })

    it("handles euro symbol", () => {
      expect(parseAmount("€1.500,00")).toBe(150000)
      expect(parseAmount("€1,500.00")).toBe(150000)
    })

    it("handles pound symbol", () => {
      expect(parseAmount("£1,500.00")).toBe(150000)
    })

    it("handles yen symbol", () => {
      expect(parseAmount("¥1500")).toBe(150000)
    })

    it("handles currency codes", () => {
      expect(parseAmount("AUD 1,500.00")).toBe(150000)
      expect(parseAmount("USD 1500.50")).toBe(150050)
      expect(parseAmount("EUR1.500,00")).toBe(150000)
    })

    it("handles negative amounts with minus sign", () => {
      expect(parseAmount("-1500.00")).toBe(-150000)
      expect(parseAmount("-$1,500.00")).toBe(-150000)
    })

    it("handles negative amounts with parentheses", () => {
      expect(parseAmount("($1,500.00)")).toBe(-150000)
      expect(parseAmount("(1500)")).toBe(-150000)
    })

    it("trims whitespace", () => {
      expect(parseAmount("  1500.00  ")).toBe(150000)
      expect(parseAmount("  $1,500.00  ")).toBe(150000)
    })

    it("rounds to nearest cent", () => {
      expect(parseAmount("1500.555")).toBe(150056) // Rounds to 1500.56
      expect(parseAmount("1500.554")).toBe(150055) // Rounds to 1500.55
    })

    it("handles very large amounts", () => {
      expect(parseAmount("$1,000,000.00")).toBe(100000000) // 1 million dollars
    })

    it("handles very small amounts", () => {
      expect(parseAmount("0.01")).toBe(1) // 1 cent
      expect(parseAmount("$0.99")).toBe(99) // 99 cents
    })

    it("throws error for invalid amount", () => {
      expect(() => parseAmount("not-a-number")).toThrow("Invalid amount: not-a-number")
      expect(() => parseAmount("abc123")).toThrow("Invalid amount")
      expect(() => parseAmount("$$$$")).toThrow("Invalid amount")
    })

    it("throws error for empty string", () => {
      expect(() => parseAmount("")).toThrow("Invalid amount")
    })

    it("handles amounts without decimals", () => {
      expect(parseAmount("1500")).toBe(150000)
      expect(parseAmount("$1,500")).toBe(150000)
    })
  })

  describe("importCostRowSchema", () => {
    it("validates valid cost row", () => {
      const validRow = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "$1,500.00",
        category: "Materials",
        vendor: "ABC Supplies",
        notes: "Delivered on time",
      }

      const result = importCostRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it("validates row with minimum required fields", () => {
      const minimalRow = {
        date: "2024-01-15",
        description: "Test expense",
        amount: "100",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(minimalRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.vendor).toBe("")
        expect(result.data.notes).toBe("")
      }
    })

    it("validates unicode characters in description", () => {
      const row = {
        date: "2024-01-15",
        description: "你好 Building materials 😀",
        amount: "1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(true)
    })

    it("rejects missing date", () => {
      const row = {
        description: "Building materials",
        amount: "1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
    })

    it("rejects invalid date format", () => {
      const row = {
        date: "invalid-date",
        description: "Building materials",
        amount: "1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Invalid date format")
      }
    })

    it("rejects missing description", () => {
      const row = {
        date: "2024-01-15",
        description: "",
        amount: "1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("required")
      }
    })

    it("rejects description over 500 characters", () => {
      const row = {
        date: "2024-01-15",
        description: "a".repeat(501),
        amount: "1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("maximum length")
      }
    })

    it("rejects missing amount", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
    })

    it("rejects invalid amount", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "not-a-number",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Invalid amount")
      }
    })

    it("rejects negative amount", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "-1500",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("must be positive")
      }
    })

    it("rejects zero amount", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "0",
        category: "Materials",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
    })

    it("rejects missing category", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "1500",
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
    })

    it("rejects notes over 1000 characters", () => {
      const row = {
        date: "2024-01-15",
        description: "Building materials",
        amount: "1500",
        category: "Materials",
        notes: "a".repeat(1001),
      }

      const result = importCostRowSchema.safeParse(row)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("maximum length")
      }
    })

    it("accepts various amount formats", () => {
      const formats = [
        "1500",
        "1500.00",
        "$1500",
        "$1,500.00",
        "€1.500,00",
        "AUD 1,500",
        "1 500.00",
      ]

      formats.forEach((amount) => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount,
          category: "Materials",
        }
        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      })
    })

    it("accepts various date formats", () => {
      const formats = [
        "2024-01-15",
        "01/15/2024",
        "15/01/2024",
        "15.01.2024",
        "January 15, 2024",
        "15 Jan 2024",
      ]

      formats.forEach((date) => {
        const row = {
          date,
          description: "Test",
          amount: "1500",
          category: "Materials",
        }
        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("detectColumnMapping", () => {
    it("detects date column", () => {
      expect(detectColumnMapping("Date")).toBe("date")
      expect(detectColumnMapping("TRANSACTION DATE")).toBe("date")
      expect(detectColumnMapping("Payment Date")).toBe("date")
      expect(detectColumnMapping("invoice_date")).toBe("date")
    })

    it("detects description column", () => {
      expect(detectColumnMapping("Description")).toBe("description")
      expect(detectColumnMapping("DESC")).toBe("description")
      expect(detectColumnMapping("Details")).toBe("description")
      expect(detectColumnMapping("Item")).toBe("description")
    })

    it("detects amount column", () => {
      expect(detectColumnMapping("Amount")).toBe("amount")
      expect(detectColumnMapping("COST")).toBe("amount")
      expect(detectColumnMapping("Price")).toBe("amount")
      expect(detectColumnMapping("Total")).toBe("amount")
    })

    it("detects category column", () => {
      expect(detectColumnMapping("Category")).toBe("category")
      expect(detectColumnMapping("TYPE")).toBe("category")
      expect(detectColumnMapping("Classification")).toBe("category")
    })

    it("detects vendor column", () => {
      expect(detectColumnMapping("Vendor")).toBe("vendor")
      expect(detectColumnMapping("SUPPLIER")).toBe("vendor")
      expect(detectColumnMapping("Company")).toBe("vendor")
      expect(detectColumnMapping("Contractor")).toBe("vendor")
      expect(detectColumnMapping("Paid To")).toBe("vendor")
    })

    it("detects notes column", () => {
      expect(detectColumnMapping("Notes")).toBe("notes")
      expect(detectColumnMapping("COMMENTS")).toBe("notes")
      expect(detectColumnMapping("Remarks")).toBe("notes")
    })

    it("is case-insensitive", () => {
      expect(detectColumnMapping("date")).toBe("date")
      expect(detectColumnMapping("DATE")).toBe("date")
      expect(detectColumnMapping("Date")).toBe("date")
      expect(detectColumnMapping("DaTe")).toBe("date")
    })

    it("trims whitespace", () => {
      expect(detectColumnMapping("  Date  ")).toBe("date")
      expect(detectColumnMapping("\tDescription\t")).toBe("description")
    })

    it("returns null for unknown columns", () => {
      expect(detectColumnMapping("Unknown Column")).toBeNull()
      expect(detectColumnMapping("XYZ123")).toBeNull()
      expect(detectColumnMapping("")).toBeNull()
    })

    it("handles partial matches", () => {
      expect(detectColumnMapping("transaction_date")).toBe("date")
      expect(detectColumnMapping("expense_amount")).toBe("amount")
      expect(detectColumnMapping("vendor_name")).toBe("vendor")
    })
  })

  describe("ERROR_MESSAGES", () => {
    it("generates invalid date message", () => {
      const message = ERROR_MESSAGES.INVALID_DATE("2024-13-45")
      expect(message).toContain("Invalid date format")
      expect(message).toContain("2024-13-45")
    })

    it("generates invalid amount message", () => {
      const message = ERROR_MESSAGES.INVALID_AMOUNT("abc")
      expect(message).toContain("Invalid amount")
      expect(message).toContain("abc")
    })

    it("generates negative amount message", () => {
      const message = ERROR_MESSAGES.NEGATIVE_AMOUNT()
      expect(message).toContain("must be positive")
    })

    it("generates missing required message", () => {
      const message = ERROR_MESSAGES.MISSING_REQUIRED("description")
      expect(message).toContain("Missing required field")
      expect(message).toContain("description")
    })

    it("generates description too long message", () => {
      const message = ERROR_MESSAGES.DESCRIPTION_TOO_LONG(600)
      expect(message).toContain("Description exceeds maximum length")
      expect(message).toContain("600")
      expect(message).toContain("500")
    })

    it("generates notes too long message", () => {
      const message = ERROR_MESSAGES.NOTES_TOO_LONG(1100)
      expect(message).toContain("Notes exceed maximum length")
      expect(message).toContain("1100")
      expect(message).toContain("1000")
    })
  })
})
