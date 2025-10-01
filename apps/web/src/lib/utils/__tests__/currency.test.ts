import { describe, it, expect } from "vitest"
import {
  formatCurrencyInput,
  parseCurrencyInput,
  dollarsToCents,
  centsToDollars,
} from "../currency"

describe("formatCurrencyInput", () => {
  it("formats numbers with thousand separators", () => {
    expect(formatCurrencyInput("1234")).toBe("1,234")
    expect(formatCurrencyInput("1234567")).toBe("1,234,567")
    expect(formatCurrencyInput("123456789")).toBe("123,456,789")
  })

  it("preserves decimal places", () => {
    expect(formatCurrencyInput("1234.56")).toBe("1,234.56")
    expect(formatCurrencyInput("1234567.89")).toBe("1,234,567.89")
  })

  it("handles partial decimal inputs", () => {
    expect(formatCurrencyInput("1234.")).toBe("1,234.")
    expect(formatCurrencyInput("1234.5")).toBe("1,234.5")
  })

  it("removes invalid characters", () => {
    expect(formatCurrencyInput("$1,234.56")).toBe("1,234.56")
    expect(formatCurrencyInput("1,234.56 AUD")).toBe("1,234.56")
    expect(formatCurrencyInput("abc1234def")).toBe("1,234")
  })

  it("handles multiple decimal points", () => {
    expect(formatCurrencyInput("12.34.56")).toBe("12.3456")
    expect(formatCurrencyInput("1.2.3.4")).toBe("1.234")
  })

  it("handles empty and zero values", () => {
    expect(formatCurrencyInput("")).toBe("")
    expect(formatCurrencyInput("0")).toBe("0")
    expect(formatCurrencyInput("0.00")).toBe("0.00")
  })

  it("handles values under 1000", () => {
    expect(formatCurrencyInput("123")).toBe("123")
    expect(formatCurrencyInput("99.99")).toBe("99.99")
  })
})

describe("parseCurrencyInput", () => {
  it("removes thousand separators", () => {
    expect(parseCurrencyInput("1,234")).toBe("1234")
    expect(parseCurrencyInput("1,234,567")).toBe("1234567")
  })

  it("removes currency symbols", () => {
    expect(parseCurrencyInput("$1234.56")).toBe("1234.56")
    expect(parseCurrencyInput("AUD 1,234")).toBe("1234")
  })

  it("preserves decimals", () => {
    expect(parseCurrencyInput("1,234.56")).toBe("1234.56")
  })

  it("removes all non-numeric except decimal", () => {
    expect(parseCurrencyInput("$1,234.56 AUD")).toBe("1234.56")
    expect(parseCurrencyInput("(1,234.56)")).toBe("1234.56")
  })
})

describe("dollarsToCents", () => {
  it("converts string dollars to cents", () => {
    expect(dollarsToCents("10.00")).toBe(1000)
    expect(dollarsToCents("1234.56")).toBe(123456)
    expect(dollarsToCents("0.99")).toBe(99)
  })

  it("converts numeric dollars to cents", () => {
    expect(dollarsToCents(10.0)).toBe(1000)
    expect(dollarsToCents(1234.56)).toBe(123456)
    expect(dollarsToCents(0.99)).toBe(99)
  })

  it("handles formatted currency strings", () => {
    expect(dollarsToCents("1,234.56")).toBe(123456)
    expect(dollarsToCents("$1,234.56")).toBe(123456)
  })

  it("rounds correctly", () => {
    expect(dollarsToCents("10.005")).toBe(1001) // Rounds up
    expect(dollarsToCents("10.004")).toBe(1000) // Rounds down
  })

  it("handles zero", () => {
    expect(dollarsToCents("0")).toBe(0)
    expect(dollarsToCents("0.00")).toBe(0)
    expect(dollarsToCents(0)).toBe(0)
  })

  it("handles large amounts", () => {
    expect(dollarsToCents("1000000.00")).toBe(100000000)
    expect(dollarsToCents("999999.99")).toBe(99999999)
  })
})

describe("centsToDollars", () => {
  it("converts cents to dollars with 2 decimal places", () => {
    expect(centsToDollars(1000)).toBe("10.00")
    expect(centsToDollars(123456)).toBe("1234.56")
    expect(centsToDollars(99)).toBe("0.99")
  })

  it("handles zero", () => {
    expect(centsToDollars(0)).toBe("0.00")
  })

  it("handles single cents", () => {
    expect(centsToDollars(1)).toBe("0.01")
    expect(centsToDollars(5)).toBe("0.05")
  })

  it("handles large amounts", () => {
    expect(centsToDollars(100000000)).toBe("1000000.00")
    expect(centsToDollars(99999999)).toBe("999999.99")
  })

  it("always returns 2 decimal places", () => {
    expect(centsToDollars(1000)).toBe("10.00")
    expect(centsToDollars(1050)).toBe("10.50")
    expect(centsToDollars(1005)).toBe("10.05")
  })
})

describe("currency utilities integration", () => {
  it("formats and parses round-trip correctly", () => {
    const formatted = formatCurrencyInput("1234.56")
    expect(formatted).toBe("1,234.56")
    const parsed = parseCurrencyInput(formatted)
    expect(parsed).toBe("1234.56")
  })

  it("converts dollars to cents and back", () => {
    const cents = dollarsToCents("1234.56")
    expect(cents).toBe(123456)
    const dollars = centsToDollars(cents)
    expect(dollars).toBe("1234.56")
  })

  it("handles formatted input through conversion pipeline", () => {
    const input = "$1,234.56"
    const cents = dollarsToCents(input)
    expect(cents).toBe(123456)
    const dollars = centsToDollars(cents)
    expect(dollars).toBe("1234.56")
    const formatted = formatCurrencyInput(dollars)
    expect(formatted).toBe("1,234.56")
  })
})
