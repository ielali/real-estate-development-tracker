import { describe, it, expect } from "vitest"
import {
  parseDate,
  parseAmount,
  detectColumnMapping,
  importCostRowSchema,
  ERROR_MESSAGES,
} from "../validations/cost-import"

describe("cost-import validations", () => {
  describe("parseDate", () => {
    describe("ISO-8601 format (unambiguous)", () => {
      it("parses YYYY-MM-DD format", () => {
        const date = parseDate("2024-01-15")
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(0) // January is 0
        expect(date.getDate()).toBe(15)
      })

      it("parses YYYY/MM/DD format", () => {
        const date = parseDate("2024/01/15")
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(15)
      })

      it("handles single-digit months and days", () => {
        const date = parseDate("2024-1-5")
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(5)
      })
    })

    describe("MM/DD/YYYY vs DD/MM/YYYY ambiguity resolution", () => {
      it("interprets as DD/MM/YYYY when first number > 12", () => {
        const date = parseDate("15/01/2024") // Must be 15th Jan, not 15th month
        expect(date.getDate()).toBe(15)
        expect(date.getMonth()).toBe(0)
        expect(date.getFullYear()).toBe(2024)
      })

      it("interprets as MM/DD/YYYY when second number > 12", () => {
        const date = parseDate("01/15/2024") // Must be Jan 15th, not 15th month
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(15)
        expect(date.getFullYear()).toBe(2024)
      })

      it("defaults to MM/DD/YYYY when both numbers ≤ 12 (ambiguous)", () => {
        const date = parseDate("03/05/2024") // Ambiguous: defaults to MM/DD/YYYY
        expect(date.getMonth()).toBe(2) // March
        expect(date.getDate()).toBe(5)
        expect(date.getFullYear()).toBe(2024)
      })
    })

    describe("European dot format", () => {
      it("parses DD.MM.YYYY format", () => {
        const date = parseDate("15.01.2024")
        expect(date.getDate()).toBe(15)
        expect(date.getMonth()).toBe(0)
        expect(date.getFullYear()).toBe(2024)
      })
    })

    describe("Long date formats", () => {
      it("parses 'MMMM dd, yyyy' format", () => {
        const date = parseDate("January 15, 2024")
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(15)
        expect(date.getFullYear()).toBe(2024)
      })

      it("parses 'dd MMM yyyy' format", () => {
        const date = parseDate("15 Jan 2024")
        expect(date.getDate()).toBe(15)
        expect(date.getMonth()).toBe(0)
        expect(date.getFullYear()).toBe(2024)
      })

      it("parses 'MMM dd, yyyy' format", () => {
        const date = parseDate("Jan 15, 2024")
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(15)
        expect(date.getFullYear()).toBe(2024)
      })
    })

    describe("edge cases", () => {
      it("handles leading/trailing whitespace", () => {
        const date = parseDate("  2024-01-15  ")
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(0)
        expect(date.getDate()).toBe(15)
      })

      it("throws error for invalid date", () => {
        expect(() => parseDate("invalid-date")).toThrow("Invalid date format")
      })

      it("throws error for empty string", () => {
        expect(() => parseDate("")).toThrow("Invalid date format")
      })

      it("handles leap year dates", () => {
        const date = parseDate("2024-02-29")
        expect(date.getMonth()).toBe(1) // February
        expect(date.getDate()).toBe(29)
      })
    })
  })

  describe("parseAmount", () => {
    describe("simple numeric formats", () => {
      it("parses plain integer", () => {
        expect(parseAmount("1500")).toBe(150000) // $1500.00 in cents
      })

      it("parses decimal number", () => {
        expect(parseAmount("1500.50")).toBe(150050) // $1500.50 in cents
      })

      it("parses number with two decimal places", () => {
        expect(parseAmount("123.45")).toBe(12345)
      })
    })

    describe("US format (1,500.00)", () => {
      it("parses amount with comma thousands separator", () => {
        expect(parseAmount("1,500.00")).toBe(150000)
      })

      it("parses amount with multiple comma separators", () => {
        expect(parseAmount("1,234,567.89")).toBe(123456789)
      })

      it("parses amount without decimal", () => {
        expect(parseAmount("1,500")).toBe(150000)
      })
    })

    describe("European format (1.500,00)", () => {
      it("parses amount with period thousands separator and comma decimal", () => {
        expect(parseAmount("1.500,00")).toBe(150000)
      })

      it("parses amount with multiple period separators", () => {
        expect(parseAmount("1.234.567,89")).toBe(123456789)
      })
    })

    describe("currency symbols", () => {
      it("handles $ symbol", () => {
        expect(parseAmount("$1,500.00")).toBe(150000)
      })

      it("handles € symbol", () => {
        expect(parseAmount("€1.500,00")).toBe(150000)
      })

      it("handles £ symbol", () => {
        expect(parseAmount("£1,500.00")).toBe(150000)
      })

      it("handles ¥ symbol", () => {
        expect(parseAmount("¥1,500")).toBe(150000)
      })
    })

    describe("currency codes", () => {
      it("handles AUD prefix", () => {
        expect(parseAmount("AUD 1,500.00")).toBe(150000)
      })

      it("handles USD prefix", () => {
        expect(parseAmount("USD 1,500.00")).toBe(150000)
      })

      it("handles EUR prefix", () => {
        expect(parseAmount("EUR 1.500,00")).toBe(150000)
      })

      it("handles GBP prefix", () => {
        expect(parseAmount("GBP 1,500.00")).toBe(150000)
      })

      it("handles case-insensitive currency codes", () => {
        expect(parseAmount("aud 1,500.00")).toBe(150000)
      })
    })

    describe("negative amounts", () => {
      it("handles minus sign", () => {
        expect(parseAmount("-1500.00")).toBe(-150000)
      })

      it("handles parentheses", () => {
        expect(parseAmount("(1500.00)")).toBe(-150000)
      })

      it("handles parentheses with currency", () => {
        expect(parseAmount("($1,500.00)")).toBe(-150000)
      })
    })

    describe("edge cases", () => {
      it("handles leading/trailing whitespace", () => {
        expect(parseAmount("  1500.00  ")).toBe(150000)
      })

      it("handles zero", () => {
        expect(parseAmount("0")).toBe(0)
      })

      it("handles decimal-only amounts", () => {
        expect(parseAmount("0.99")).toBe(99)
      })

      it("handles three decimal places", () => {
        expect(parseAmount("10.005")).toBe(1000500) // $10,005.00 in cents
      })

      it("throws error for invalid amount", () => {
        expect(() => parseAmount("invalid")).toThrow("Invalid amount")
      })

      it("throws error for empty string", () => {
        expect(() => parseAmount("")).toThrow("Invalid amount")
      })

      it("throws error for letters mixed with numbers", () => {
        expect(() => parseAmount("abc123")).toThrow("Invalid amount")
      })
    })
  })

  describe("detectColumnMapping", () => {
    describe("date field detection", () => {
      it("detects 'date' header", () => {
        expect(detectColumnMapping("date")).toBe("date")
      })

      it("detects 'Date' (case insensitive)", () => {
        expect(detectColumnMapping("Date")).toBe("date")
      })

      it("detects 'transaction date'", () => {
        expect(detectColumnMapping("transaction date")).toBe("date")
      })

      it("detects 'payment date'", () => {
        expect(detectColumnMapping("payment date")).toBe("date")
      })

      it("detects 'invoice date'", () => {
        expect(detectColumnMapping("invoice date")).toBe("date")
      })

      it("detects 'trans date'", () => {
        expect(detectColumnMapping("trans date")).toBe("date")
      })

      it("detects 'cost date'", () => {
        expect(detectColumnMapping("cost date")).toBe("date")
      })
    })

    describe("description field detection", () => {
      it("detects 'description'", () => {
        expect(detectColumnMapping("description")).toBe("description")
      })

      it("detects 'desc'", () => {
        expect(detectColumnMapping("desc")).toBe("description")
      })

      it("detects 'details'", () => {
        expect(detectColumnMapping("details")).toBe("description")
      })

      it("detects 'item'", () => {
        expect(detectColumnMapping("item")).toBe("description")
      })

      it("detects 'memo'", () => {
        expect(detectColumnMapping("memo")).toBe("description")
      })

      it("detects 'note'", () => {
        expect(detectColumnMapping("note")).toBe("description")
      })

      it("detects 'purpose'", () => {
        expect(detectColumnMapping("purpose")).toBe("description")
      })

      it("detects 'expense'", () => {
        expect(detectColumnMapping("expense")).toBe("description")
      })
    })

    describe("amount field detection", () => {
      it("detects 'amount'", () => {
        expect(detectColumnMapping("amount")).toBe("amount")
      })

      it("detects 'cost'", () => {
        expect(detectColumnMapping("cost")).toBe("amount")
      })

      it("detects 'price'", () => {
        expect(detectColumnMapping("price")).toBe("amount")
      })

      it("detects 'total'", () => {
        expect(detectColumnMapping("total")).toBe("amount")
      })

      it("detects 'value'", () => {
        expect(detectColumnMapping("value")).toBe("amount")
      })

      it("detects 'sum'", () => {
        expect(detectColumnMapping("sum")).toBe("amount")
      })

      it("detects 'spent'", () => {
        expect(detectColumnMapping("spent")).toBe("amount")
      })
    })

    describe("category field detection", () => {
      it("detects 'category'", () => {
        expect(detectColumnMapping("category")).toBe("category")
      })

      it("detects 'type'", () => {
        expect(detectColumnMapping("type")).toBe("category")
      })

      it("detects 'classification'", () => {
        expect(detectColumnMapping("classification")).toBe("category")
      })

      it("detects 'class'", () => {
        expect(detectColumnMapping("class")).toBe("category")
      })

      it("detects 'group'", () => {
        expect(detectColumnMapping("group")).toBe("category")
      })

      it("detects 'expense type'", () => {
        expect(detectColumnMapping("expense type")).toBe("category")
      })
    })

    describe("vendor field detection", () => {
      it("detects 'vendor'", () => {
        expect(detectColumnMapping("vendor")).toBe("vendor")
      })

      it("detects 'supplier'", () => {
        expect(detectColumnMapping("supplier")).toBe("vendor")
      })

      it("detects 'company'", () => {
        expect(detectColumnMapping("company")).toBe("vendor")
      })

      it("detects 'contractor'", () => {
        expect(detectColumnMapping("contractor")).toBe("vendor")
      })

      it("detects 'payee'", () => {
        expect(detectColumnMapping("payee")).toBe("vendor")
      })

      it("detects 'merchant'", () => {
        expect(detectColumnMapping("merchant")).toBe("vendor")
      })

      it("detects 'contact'", () => {
        expect(detectColumnMapping("contact")).toBe("vendor")
      })

      it("detects 'paid to'", () => {
        expect(detectColumnMapping("paid to")).toBe("vendor")
      })
    })

    describe("notes field detection", () => {
      it("detects 'notes'", () => {
        expect(detectColumnMapping("notes")).toBe("notes")
      })

      it("detects 'comments'", () => {
        expect(detectColumnMapping("comments")).toBe("notes")
      })

      it("detects 'remarks'", () => {
        expect(detectColumnMapping("remarks")).toBe("notes")
      })

      it("detects 'additional notes'", () => {
        expect(detectColumnMapping("additional notes")).toBe("notes")
      })

      it("detects 'description 2'", () => {
        expect(detectColumnMapping("description 2")).toBe("notes")
      })
    })

    describe("edge cases", () => {
      it("handles whitespace", () => {
        expect(detectColumnMapping("  date  ")).toBe("date")
      })

      it("is case insensitive", () => {
        expect(detectColumnMapping("DATE")).toBe("date")
        expect(detectColumnMapping("Amount")).toBe("amount")
        expect(detectColumnMapping("VENDOR")).toBe("vendor")
      })

      it("returns null for unrecognized header", () => {
        expect(detectColumnMapping("unknown_column")).toBeNull()
      })

      it("returns null for empty string", () => {
        expect(detectColumnMapping("")).toBeNull()
      })

      it("handles partial matches", () => {
        expect(detectColumnMapping("transaction_date")).toBe("date")
        expect(detectColumnMapping("cost_amount")).toBe("amount")
      })
    })
  })

  describe("importCostRowSchema", () => {
    describe("valid data", () => {
      it("validates complete row with all fields", () => {
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

      it("validates row with only required fields", () => {
        const validRow = {
          date: "2024-01-15",
          description: "Building materials",
          amount: "1500",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(validRow)
        expect(result.success).toBe(true)
      })

      it("applies defaults for optional fields", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        if (result.success) {
          expect(result.data.vendor).toBe("")
          expect(result.data.notes).toBe("")
        }
      })
    })

    describe("date validation", () => {
      it("rejects invalid date format", () => {
        const row = {
          date: "invalid-date",
          description: "Test",
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("accepts various date formats", () => {
        const formats = ["2024-01-15", "01/15/2024", "15/01/2024", "15.01.2024", "January 15, 2024"]

        formats.forEach((dateFormat) => {
          const row = {
            date: dateFormat,
            description: "Test",
            amount: "100",
            category: "Materials",
          }

          const result = importCostRowSchema.safeParse(row)
          expect(result.success).toBe(true)
        })
      })
    })

    describe("description validation", () => {
      it("rejects empty description", () => {
        const row = {
          date: "2024-01-15",
          description: "",
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("rejects whitespace-only description", () => {
        const row = {
          date: "2024-01-15",
          description: "   ",
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("rejects description exceeding 500 characters", () => {
        const row = {
          date: "2024-01-15",
          description: "x".repeat(501),
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("accepts description at max length", () => {
        const row = {
          date: "2024-01-15",
          description: "x".repeat(500),
          amount: "100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      })
    })

    describe("amount validation", () => {
      it("rejects negative amount", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "-100",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("rejects zero amount", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "0",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("rejects invalid amount format", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "invalid",
          category: "Materials",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("accepts various amount formats", () => {
        const formats = ["100", "100.00", "$100.00", "1,500.00", "€1.500,00"]

        formats.forEach((amountFormat) => {
          const row = {
            date: "2024-01-15",
            description: "Test",
            amount: amountFormat,
            category: "Materials",
          }

          const result = importCostRowSchema.safeParse(row)
          expect(result.success).toBe(true)
        })
      })
    })

    describe("category validation", () => {
      it("rejects empty category", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "",
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("rejects category exceeding 100 characters", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "x".repeat(101),
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })
    })

    describe("vendor validation", () => {
      it("rejects vendor exceeding 200 characters", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "Materials",
          vendor: "x".repeat(201),
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("accepts vendor at max length", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "Materials",
          vendor: "x".repeat(200),
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      })
    })

    describe("notes validation", () => {
      it("rejects notes exceeding 1000 characters", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "Materials",
          notes: "x".repeat(1001),
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(false)
      })

      it("accepts notes at max length", () => {
        const row = {
          date: "2024-01-15",
          description: "Test",
          amount: "100",
          category: "Materials",
          notes: "x".repeat(1000),
        }

        const result = importCostRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("ERROR_MESSAGES", () => {
    it("generates INVALID_DATE message", () => {
      const message = ERROR_MESSAGES.INVALID_DATE("invalid-date")
      expect(message).toContain("Invalid date format")
      expect(message).toContain("invalid-date")
    })

    it("generates INVALID_AMOUNT message", () => {
      const message = ERROR_MESSAGES.INVALID_AMOUNT("invalid")
      expect(message).toContain("Invalid amount")
      expect(message).toContain("invalid")
    })

    it("generates NEGATIVE_AMOUNT message", () => {
      const message = ERROR_MESSAGES.NEGATIVE_AMOUNT()
      expect(message).toContain("positive")
    })

    it("generates MISSING_REQUIRED message", () => {
      const message = ERROR_MESSAGES.MISSING_REQUIRED("date")
      expect(message).toContain("Missing required field")
      expect(message).toContain("date")
    })

    it("generates DESCRIPTION_TOO_LONG message", () => {
      const message = ERROR_MESSAGES.DESCRIPTION_TOO_LONG(600)
      expect(message).toContain("600")
      expect(message).toContain("500")
    })

    it("generates NOTES_TOO_LONG message", () => {
      const message = ERROR_MESSAGES.NOTES_TOO_LONG(1200)
      expect(message).toContain("1200")
      expect(message).toContain("1000")
    })
  })
})
