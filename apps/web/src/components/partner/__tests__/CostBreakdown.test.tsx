/**
 * CostBreakdown Component Tests
 *
 * Story 4.3 - Partner Dashboard
 *
 * Tests for the CostBreakdown component to ensure it correctly displays
 * cost data, pie chart, and data table.
 */

import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { CostBreakdown, type CostBreakdownItem } from "../CostBreakdown"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock Recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: React.PropsWithChildren) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe("CostBreakdown", () => {
  const mockData: CostBreakdownItem[] = [
    {
      categoryId: "mat-1",
      categoryName: "Materials",
      total: 100000_00, // $100,000.00
      percentage: 50,
    },
    {
      categoryId: "lab-1",
      categoryName: "Labor",
      total: 60000_00, // $60,000.00
      percentage: 30,
    },
    {
      categoryId: "per-1",
      categoryName: "Permits",
      total: 40000_00, // $40,000.00
      percentage: 20,
    },
  ]

  const totalSpent = 200000_00 // $200,000.00

  describe("Empty State", () => {
    it("should display empty state when no data", () => {
      render(<CostBreakdown data={[]} totalSpent={0} />)
      expect(screen.getByText("No costs recorded yet")).toBeInTheDocument()
      expect(screen.getByText("Costs will appear here once they are added")).toBeInTheDocument()
    })

    it("should not display chart when empty", () => {
      const { queryByTestId } = render(<CostBreakdown data={[]} totalSpent={0} />)
      expect(queryByTestId("pie-chart")).not.toBeInTheDocument()
    })

    it("should not display table when empty", () => {
      render(<CostBreakdown data={[]} totalSpent={0} />)
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })
  })

  describe("Header Display", () => {
    it("should display component title", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("Cost Breakdown")).toBeInTheDocument()
    })

    it("should display total spent correctly formatted", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("Total Spent: $200,000.00")).toBeInTheDocument()
    })

    it("should handle zero total spent", () => {
      render(<CostBreakdown data={mockData} totalSpent={0} />)
      expect(screen.getByText("Total Spent: $0.00")).toBeInTheDocument()
    })

    it("should format large amounts correctly", () => {
      const largeAmount = 1500000_00 // $1,500,000.00
      render(<CostBreakdown data={mockData} totalSpent={largeAmount} />)
      expect(screen.getByText("Total Spent: $1,500,000.00")).toBeInTheDocument()
    })
  })

  describe("Chart Rendering", () => {
    it("should render pie chart container", () => {
      const { getByTestId } = render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(getByTestId("pie-chart")).toBeInTheDocument()
    })

    it("should render responsive container", () => {
      const { getByTestId } = render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(getByTestId("responsive-container")).toBeInTheDocument()
    })
  })

  describe("Table Display", () => {
    it("should render data table", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("should display all category names", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("Materials")).toBeInTheDocument()
      expect(screen.getByText("Labor")).toBeInTheDocument()
      expect(screen.getByText("Permits")).toBeInTheDocument()
    })

    it("should display all amounts correctly formatted", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("$100,000.00")).toBeInTheDocument()
      expect(screen.getByText("$60,000.00")).toBeInTheDocument()
      expect(screen.getByText("$40,000.00")).toBeInTheDocument()
    })

    it("should display all percentages", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("50%")).toBeInTheDocument()
      expect(screen.getByText("30%")).toBeInTheDocument()
      expect(screen.getByText("20%")).toBeInTheDocument()
    })

    it("should have table headers", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)
      expect(screen.getByText("Category")).toBeInTheDocument()
      expect(screen.getByText("Amount")).toBeInTheDocument()
      expect(screen.getByText("Percentage")).toBeInTheDocument()
    })
  })

  describe("Data Ordering", () => {
    it("should display categories in the provided order", () => {
      render(<CostBreakdown data={mockData} totalSpent={totalSpent} />)

      const rows = screen.getAllByRole("row")
      // First row is header, so data starts at index 1
      expect(rows[1]).toHaveTextContent("Materials")
      expect(rows[2]).toHaveTextContent("Labor")
      expect(rows[3]).toHaveTextContent("Permits")
    })
  })

  describe("Edge Cases", () => {
    it("should handle single category", () => {
      const singleCategory: CostBreakdownItem[] = [
        {
          categoryId: "mat-1",
          categoryName: "Materials",
          total: 100000_00,
          percentage: 100,
        },
      ]
      render(<CostBreakdown data={singleCategory} totalSpent={100000_00} />)
      expect(screen.getByText("Materials")).toBeInTheDocument()
      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should handle very small percentages", () => {
      const smallPercentageData: CostBreakdownItem[] = [
        {
          categoryId: "mat-1",
          categoryName: "Materials",
          total: 99900_00,
          percentage: 99.9,
        },
        {
          categoryId: "misc-1",
          categoryName: "Misc",
          total: 100_00,
          percentage: 0.1,
        },
      ]
      render(<CostBreakdown data={smallPercentageData} totalSpent={100000_00} />)
      expect(screen.getByText("99.9%")).toBeInTheDocument()
      expect(screen.getByText("0.1%")).toBeInTheDocument()
    })

    it("should handle decimal amounts", () => {
      const decimalData: CostBreakdownItem[] = [
        {
          categoryId: "mat-1",
          categoryName: "Materials",
          total: 100050, // $1000.50
          percentage: 100,
        },
      ]
      render(<CostBreakdown data={decimalData} totalSpent={100050} />)
      expect(screen.getByText("$1,000.50")).toBeInTheDocument()
    })

    it("should handle very long category names", () => {
      const longNameData: CostBreakdownItem[] = [
        {
          categoryId: "long-1",
          categoryName: "Very Long Category Name That Should Be Displayed",
          total: 100000_00,
          percentage: 100,
        },
      ]
      render(<CostBreakdown data={longNameData} totalSpent={100000_00} />)
      expect(
        screen.getByText("Very Long Category Name That Should Be Displayed")
      ).toBeInTheDocument()
    })

    it("should handle many categories", () => {
      const manyCategories: CostBreakdownItem[] = Array.from({ length: 10 }, (_, i) => ({
        categoryId: `cat-${i + 1}`,
        categoryName: `Category ${i + 1}`,
        total: 10000_00,
        percentage: 10,
      }))
      render(<CostBreakdown data={manyCategories} totalSpent={100000_00} />)

      // All categories should be visible
      manyCategories.forEach((cat) => {
        expect(screen.getByText(cat.categoryName)).toBeInTheDocument()
      })
    })
  })

  describe("Currency Formatting", () => {
    it("should format amounts with commas", () => {
      const largeAmountData: CostBreakdownItem[] = [
        {
          categoryId: "mat-1",
          categoryName: "Materials",
          total: 1234567_89, // $12,345.67.89 -> $12,345.67
          percentage: 100,
        },
      ]
      render(<CostBreakdown data={largeAmountData} totalSpent={1234567_89} />)
      // Should have commas in the formatted amount
      expect(screen.getByText(/12,345/)).toBeInTheDocument()
    })

    it("should always show two decimal places", () => {
      const evenAmountData: CostBreakdownItem[] = [
        {
          categoryId: "mat-1",
          categoryName: "Materials",
          total: 100000, // $1000.00
          percentage: 100,
        },
      ]
      render(<CostBreakdown data={evenAmountData} totalSpent={100000} />)
      expect(screen.getByText("$1,000.00")).toBeInTheDocument()
    })
  })
})
