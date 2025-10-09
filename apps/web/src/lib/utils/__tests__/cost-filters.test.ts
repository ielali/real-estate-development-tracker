/**
 * Cost Filter Utilities Tests
 */

import { describe, test, expect } from "vitest"
import {
  hasActiveFilters,
  countActiveFilters,
  clearAllFilters,
  formatAmountForDisplay,
  parseAmountToCents,
  getFilterDescription,
  DEFAULT_FILTER_PRESETS,
} from "../cost-filters"
import type { CostFilters } from "../cost-filters"

describe("Cost Filter Utilities", () => {
  describe("hasActiveFilters", () => {
    test("should return false for empty filters", () => {
      expect(hasActiveFilters({})).toBe(false)
    })

    test("should return true when search text provided", () => {
      expect(hasActiveFilters({}, "test")).toBe(true)
    })

    test("should return true when any filter is active", () => {
      expect(hasActiveFilters({ categoryId: "cat-1" })).toBe(true)
      expect(hasActiveFilters({ startDate: new Date() })).toBe(true)
      expect(hasActiveFilters({ minAmount: 1000 })).toBe(true)
      expect(hasActiveFilters({ contactId: "contact-1" })).toBe(true)
    })
  })

  describe("countActiveFilters", () => {
    test("should return 0 for empty filters", () => {
      expect(countActiveFilters({})).toBe(0)
    })

    test("should count search text as 1 filter", () => {
      expect(countActiveFilters({}, "search")).toBe(1)
    })

    test("should count date range as 1 filter", () => {
      const filters: CostFilters = {
        startDate: new Date(),
        endDate: new Date(),
      }
      expect(countActiveFilters(filters)).toBe(1)
    })

    test("should count amount range as 1 filter", () => {
      const filters: CostFilters = {
        minAmount: 1000,
        maxAmount: 5000,
      }
      expect(countActiveFilters(filters)).toBe(1)
    })

    test("should count all different filter types", () => {
      const filters: CostFilters = {
        categoryId: "cat-1",
        startDate: new Date(),
        minAmount: 1000,
        contactId: "contact-1",
      }
      expect(countActiveFilters(filters, "search")).toBe(5) // search + 4 filter types
    })
  })

  describe("clearAllFilters", () => {
    test("should return empty object", () => {
      expect(clearAllFilters()).toEqual({})
    })
  })

  describe("formatAmountForDisplay", () => {
    test("should format cents to dollars with 2 decimals", () => {
      expect(formatAmountForDisplay(100)).toBe("1.00")
      expect(formatAmountForDisplay(12345)).toBe("123.45")
      expect(formatAmountForDisplay(500)).toBe("5.00")
    })

    test("should handle zero", () => {
      expect(formatAmountForDisplay(0)).toBe("0.00")
    })

    test("should handle large amounts", () => {
      expect(formatAmountForDisplay(1000000)).toBe("10000.00")
    })
  })

  describe("parseAmountToCents", () => {
    test("should parse dollars to cents", () => {
      expect(parseAmountToCents("1.00")).toBe(100)
      expect(parseAmountToCents("123.45")).toBe(12345)
      expect(parseAmountToCents("5")).toBe(500)
    })

    test("should round to nearest cent", () => {
      expect(parseAmountToCents("1.234")).toBe(123)
      expect(parseAmountToCents("1.235")).toBe(124)
    })

    test("should return undefined for invalid input", () => {
      expect(parseAmountToCents("abc")).toBeUndefined()
      expect(parseAmountToCents("")).toBeUndefined()
    })

    test("should handle zero", () => {
      expect(parseAmountToCents("0")).toBe(0)
      expect(parseAmountToCents("0.00")).toBe(0)
    })
  })

  describe("getFilterDescription", () => {
    test("should return empty array for no filters", () => {
      expect(getFilterDescription({})).toEqual([])
    })

    test("should describe search text", () => {
      const descriptions = getFilterDescription({}, "plumbing")
      expect(descriptions).toContain('Search: "plumbing"')
    })

    test("should describe date range", () => {
      const start = new Date("2024-01-01")
      const end = new Date("2024-01-31")
      const descriptions = getFilterDescription({ startDate: start, endDate: end })

      expect(descriptions[0]).toContain("Date:")
      expect(descriptions[0]).toContain("1/1/2024")
      expect(descriptions[0]).toContain("1/31/2024")
    })

    test("should describe start date only", () => {
      const descriptions = getFilterDescription({ startDate: new Date("2024-01-01") })
      expect(descriptions[0]).toContain("After:")
    })

    test("should describe end date only", () => {
      const descriptions = getFilterDescription({ endDate: new Date("2024-01-31") })
      expect(descriptions[0]).toContain("Before:")
    })

    test("should describe amount range", () => {
      const descriptions = getFilterDescription({
        minAmount: 100000,
        maxAmount: 500000,
      })
      expect(descriptions[0]).toContain("Amount: $1000.00 - $5000.00")
    })

    test("should describe contact name search", () => {
      const descriptions = getFilterDescription({ contactNameSearch: "John" })
      expect(descriptions).toContain('Contact: "John"')
    })

    test("should describe multiple filters", () => {
      const descriptions = getFilterDescription(
        {
          categoryId: "cat-1",
          minAmount: 1000,
          contactNameSearch: "John",
        },
        "plumbing"
      )

      expect(descriptions.length).toBeGreaterThan(0)
      expect(descriptions.some((d) => d.includes("Search"))).toBe(true)
      expect(descriptions.some((d) => d.includes("Min:"))).toBe(true)
      expect(descriptions.some((d) => d.includes("Contact"))).toBe(true)
    })
  })

  describe("DEFAULT_FILTER_PRESETS", () => {
    test("should have defined presets", () => {
      expect(DEFAULT_FILTER_PRESETS).toHaveLength(3)
    })

    test("should have last-30-days preset", () => {
      const preset = DEFAULT_FILTER_PRESETS.find((p) => p.id === "last-30-days")
      expect(preset).toBeDefined()
      expect(preset?.filters.startDate).toBeDefined()
    })

    test("should have over-1000 preset", () => {
      const preset = DEFAULT_FILTER_PRESETS.find((p) => p.id === "over-1000")
      expect(preset).toBeDefined()
      expect(preset?.filters.minAmount).toBe(100000) // $1000 in cents
    })

    test("should have this-month preset", () => {
      const preset = DEFAULT_FILTER_PRESETS.find((p) => p.id === "this-month")
      expect(preset).toBeDefined()
      expect(preset?.filters.startDate).toBeDefined()
      expect(preset?.filters.endDate).toBeDefined()
    })
  })
})
