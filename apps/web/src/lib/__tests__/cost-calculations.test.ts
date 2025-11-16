import { describe, it, expect } from "vitest"
import {
  calculateCostSummary,
  getBudgetStatus,
  getStatusColor,
  formatCurrency,
  aggregateByCategory,
  aggregateByMonth,
} from "../cost-calculations"

describe("cost-calculations", () => {
  describe("calculateCostSummary", () => {
    it("should calculate summary with valid data", () => {
      const costs = [
        {
          amount: 10000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-01-01"),
        },
        {
          amount: 20000,
          category: { id: "2", displayName: "Materials" },
          date: new Date("2024-01-15"),
        },
        {
          amount: 15000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-02-01"),
        },
      ]
      const budget = 50000

      const summary = calculateCostSummary(costs, budget)

      expect(summary.totalBudget).toBe(50000)
      expect(summary.totalSpent).toBe(45000)
      expect(summary.remaining).toBe(5000)
      expect(summary.variance).toBe(-5000) // Under budget
      expect(summary.percentSpent).toBe(90.0)
    })

    it("should handle zero budget", () => {
      const costs = [
        { amount: 10000, category: { id: "1", displayName: "Construction" }, date: new Date() },
      ]
      const budget = 0

      const summary = calculateCostSummary(costs, budget)

      expect(summary.totalBudget).toBe(0)
      expect(summary.totalSpent).toBe(10000)
      expect(summary.percentSpent).toBe(0)
    })

    it("should handle null budget", () => {
      const costs = [
        { amount: 10000, category: { id: "1", displayName: "Construction" }, date: new Date() },
      ]

      const summary = calculateCostSummary(costs, null)

      expect(summary.totalBudget).toBe(0)
      expect(summary.totalSpent).toBe(10000)
    })

    it("should handle empty costs", () => {
      const summary = calculateCostSummary([], 50000)

      expect(summary.totalBudget).toBe(50000)
      expect(summary.totalSpent).toBe(0)
      expect(summary.remaining).toBe(50000)
      expect(summary.variance).toBe(-50000)
      expect(summary.percentSpent).toBe(0)
    })

    it("should handle over-budget scenario", () => {
      const costs = [
        { amount: 30000, category: { id: "1", displayName: "Construction" }, date: new Date() },
        { amount: 30000, category: { id: "2", displayName: "Materials" }, date: new Date() },
      ]
      const budget = 50000

      const summary = calculateCostSummary(costs, budget)

      expect(summary.totalSpent).toBe(60000)
      expect(summary.remaining).toBe(-10000) // Negative = over budget
      expect(summary.variance).toBe(10000) // Positive = over budget
      expect(summary.percentSpent).toBe(120.0)
    })

    it("should use Decimal.js for precise calculations", () => {
      const costs = [
        { amount: 33, category: { id: "1", displayName: "Construction" }, date: new Date() },
        { amount: 33, category: { id: "2", displayName: "Materials" }, date: new Date() },
        { amount: 34, category: { id: "3", displayName: "Labor" }, date: new Date() },
      ]
      const budget = 100

      const summary = calculateCostSummary(costs, budget)

      expect(summary.totalSpent).toBe(100)
      expect(summary.percentSpent).toBe(100.0)
    })
  })

  describe("getBudgetStatus", () => {
    it("should return 'good' for <80%", () => {
      expect(getBudgetStatus(50)).toBe("good")
      expect(getBudgetStatus(79.9)).toBe("good")
    })

    it("should return 'warning' for 80-99%", () => {
      expect(getBudgetStatus(80)).toBe("warning")
      expect(getBudgetStatus(95)).toBe("warning")
      expect(getBudgetStatus(99.9)).toBe("warning")
    })

    it("should return 'over' for >=100%", () => {
      expect(getBudgetStatus(100)).toBe("over")
      expect(getBudgetStatus(150)).toBe("over")
    })
  })

  describe("getStatusColor", () => {
    it("should return green colors for good status", () => {
      const colors = getStatusColor("good")
      expect(colors.text).toContain("green")
      expect(colors.bg).toContain("green")
      expect(colors.dot).toContain("green")
    })

    it("should return orange colors for warning status", () => {
      const colors = getStatusColor("warning")
      expect(colors.text).toContain("orange")
      expect(colors.bg).toContain("orange")
      expect(colors.dot).toContain("orange")
    })

    it("should return red colors for over status", () => {
      const colors = getStatusColor("over")
      expect(colors.text).toContain("red")
      expect(colors.bg).toContain("red")
      expect(colors.dot).toContain("red")
    })
  })

  describe("formatCurrency", () => {
    it("should format currency with cents", () => {
      expect(formatCurrency(12345, true)).toContain("123.45")
      expect(formatCurrency(12345, true)).toContain("$")
    })

    it("should format currency without cents", () => {
      const result = formatCurrency(12345, false)
      expect(result).toContain("123")
      expect(result).not.toContain(".45")
    })

    it("should handle negative amounts", () => {
      const result = formatCurrency(-12345, true)
      expect(result).toContain("-")
    })

    it("should handle zero", () => {
      const result = formatCurrency(0, true)
      expect(result).toContain("0.00")
    })
  })

  describe("aggregateByCategory", () => {
    it("should aggregate costs by category", () => {
      const costs = [
        { amount: 10000, category: { id: "1", displayName: "Construction" }, date: new Date() },
        { amount: 20000, category: { id: "2", displayName: "Materials" }, date: new Date() },
        { amount: 15000, category: { id: "1", displayName: "Construction" }, date: new Date() },
      ]

      const result = aggregateByCategory(costs)

      expect(result).toHaveLength(2)
      const construction = result.find((r) => r.category === "Construction")
      expect(construction?.total).toBe(25000)
      expect(construction?.count).toBe(2)
    })

    it("should handle costs without categories", () => {
      const costs = [
        { amount: 10000, category: undefined, date: new Date() },
        { amount: 20000, category: { id: "1", displayName: "Construction" }, date: new Date() },
      ]

      const result = aggregateByCategory(costs)

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe("Construction")
    })

    it("should handle empty costs array", () => {
      const result = aggregateByCategory([])
      expect(result).toHaveLength(0)
    })
  })

  describe("aggregateByMonth", () => {
    it("should aggregate costs by month", () => {
      const costs = [
        {
          amount: 10000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-01-15"),
        },
        {
          amount: 20000,
          category: { id: "2", displayName: "Materials" },
          date: new Date("2024-01-20"),
        },
        {
          amount: 15000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-02-10"),
        },
      ]

      const result = aggregateByMonth(costs)

      expect(result).toHaveLength(2)
      expect(result[0].month).toBe("2024-01")
      expect(result[0].monthTotal).toBe(30000)
      expect(result[0].cumulative).toBe(30000)
      expect(result[1].cumulative).toBe(45000)
    })

    it("should calculate cumulative spending correctly", () => {
      const costs = [
        {
          amount: 10000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-01-01"),
        },
        {
          amount: 20000,
          category: { id: "2", displayName: "Materials" },
          date: new Date("2024-02-01"),
        },
        {
          amount: 30000,
          category: { id: "3", displayName: "Labor" },
          date: new Date("2024-03-01"),
        },
      ]

      const result = aggregateByMonth(costs)

      expect(result[0].cumulative).toBe(10000)
      expect(result[1].cumulative).toBe(30000)
      expect(result[2].cumulative).toBe(60000)
    })

    it("should sort by month chronologically", () => {
      const costs = [
        {
          amount: 10000,
          category: { id: "1", displayName: "Construction" },
          date: new Date("2024-03-01"),
        },
        {
          amount: 20000,
          category: { id: "2", displayName: "Materials" },
          date: new Date("2024-01-01"),
        },
        {
          amount: 30000,
          category: { id: "3", displayName: "Labor" },
          date: new Date("2024-02-01"),
        },
      ]

      const result = aggregateByMonth(costs)

      expect(result[0].month).toBe("2024-01")
      expect(result[1].month).toBe("2024-02")
      expect(result[2].month).toBe("2024-03")
    })

    it("should handle empty costs array", () => {
      const result = aggregateByMonth([])
      expect(result).toHaveLength(0)
    })
  })
})
