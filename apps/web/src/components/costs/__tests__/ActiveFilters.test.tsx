/**
 * ActiveFilters Component Tests
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActiveFilters } from "../ActiveFilters"
import type { CostFilters } from "@/lib/utils/cost-filters"

describe("ActiveFilters", () => {
  test("should render nothing when no filters active", () => {
    const { container } = render(
      <ActiveFilters
        filters={{}}
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  test("should display search filter badge", () => {
    render(
      <ActiveFilters
        filters={{}}
        searchText="plumbing"
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    expect(screen.getByText(/Search: "plumbing"/i)).toBeInTheDocument()
  })

  test("should display category filter badge", () => {
    const filters: CostFilters = { categoryId: "cat-1" }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    expect(screen.getByText(/Category/i)).toBeInTheDocument()
  })

  test("should display date range filter badge", () => {
    const filters: CostFilters = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    const badge = screen.getByText(/1\/1\/2024.*1\/31\/2024/i)
    expect(badge).toBeInTheDocument()
  })

  test("should display amount range filter badge", () => {
    const filters: CostFilters = {
      minAmount: 100000, // $1000
      maxAmount: 500000, // $5000
    }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    const badge = screen.getByText(/\$1000\.00.*\$5000\.00/i)
    expect(badge).toBeInTheDocument()
  })

  test("should display contact filter badge", () => {
    const filters: CostFilters = { contactId: "contact-1" }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    expect(screen.getByText(/Contact/i)).toBeInTheDocument()
  })

  test("should call onClearSearch when search badge removed", () => {
    const onClearSearch = vi.fn()
    render(
      <ActiveFilters
        filters={{}}
        searchText="test"
        onRemoveFilter={vi.fn()}
        onClearSearch={onClearSearch}
        onClearAll={vi.fn()}
      />
    )

    const removeButton = screen.getByLabelText(/clear search/i)
    fireEvent.click(removeButton)

    expect(onClearSearch).toHaveBeenCalled()
  })

  test("should call onRemoveFilter when filter badge removed", () => {
    const onRemoveFilter = vi.fn()
    const filters: CostFilters = { categoryId: "cat-1" }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={onRemoveFilter}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    const removeButton = screen.getByLabelText(/remove category filter/i)
    fireEvent.click(removeButton)

    expect(onRemoveFilter).toHaveBeenCalledWith("categoryId")
  })

  test("should call onClearAll when clear all button clicked", () => {
    const onClearAll = vi.fn()
    render(
      <ActiveFilters
        filters={{ categoryId: "cat-1" }}
        searchText="test"
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={onClearAll}
      />
    )

    fireEvent.click(screen.getByText(/clear all/i))

    expect(onClearAll).toHaveBeenCalled()
  })

  test("should display multiple filter badges", () => {
    const filters: CostFilters = {
      categoryId: "cat-1",
      minAmount: 1000,
      contactId: "contact-1",
    }
    render(
      <ActiveFilters
        filters={filters}
        searchText="test"
        onRemoveFilter={vi.fn()}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    expect(screen.getByText(/Search/i)).toBeInTheDocument()
    expect(screen.getByText(/Category/i)).toBeInTheDocument()
    expect(screen.getByText(/Contact/i)).toBeInTheDocument()
    expect(screen.getByText(/Min \$/i)).toBeInTheDocument()
  })

  test("should handle removing date range filter", () => {
    const onRemoveFilter = vi.fn()
    const filters: CostFilters = {
      startDate: new Date(),
      endDate: new Date(),
    }
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={onRemoveFilter}
        onClearSearch={vi.fn()}
        onClearAll={vi.fn()}
      />
    )

    const removeButton = screen.getByLabelText(/remove date filter/i)
    fireEvent.click(removeButton)

    expect(onRemoveFilter).toHaveBeenCalledWith("startDate")
    expect(onRemoveFilter).toHaveBeenCalledWith("endDate")
  })
})
