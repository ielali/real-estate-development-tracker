/**
 * useCostFilters Hook Tests
 */

import { describe, test, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCostFilters } from "../useCostFilters"

describe("useCostFilters", () => {
  test("should initialize with default values", () => {
    const { result } = renderHook(() => useCostFilters())

    expect(result.current.filters).toEqual({})
    expect(result.current.searchText).toBe("")
    expect(result.current.sortBy).toBe("date")
    expect(result.current.sortDirection).toBe("desc")
  })

  test("should initialize with provided values", () => {
    const { result } = renderHook(() =>
      useCostFilters({ categoryId: "cat-1" }, "test", "amount", "asc")
    )

    expect(result.current.filters).toEqual({ categoryId: "cat-1" })
    expect(result.current.searchText).toBe("test")
    expect(result.current.sortBy).toBe("amount")
    expect(result.current.sortDirection).toBe("asc")
  })

  test("should update filters", () => {
    const { result } = renderHook(() => useCostFilters())

    act(() => {
      result.current.setFilters({ categoryId: "cat-1" })
    })

    expect(result.current.filters).toEqual({ categoryId: "cat-1" })
  })

  test("should update search text", () => {
    const { result } = renderHook(() => useCostFilters())

    act(() => {
      result.current.setSearchText("plumbing")
    })

    expect(result.current.searchText).toBe("plumbing")
  })

  test("should update sort settings", () => {
    const { result } = renderHook(() => useCostFilters())

    act(() => {
      result.current.setSortBy("amount")
      result.current.setSortDirection("asc")
    })

    expect(result.current.sortBy).toBe("amount")
    expect(result.current.sortDirection).toBe("asc")
  })

  test("should update single filter field", () => {
    const { result } = renderHook(() => useCostFilters())

    act(() => {
      result.current.updateFilter("categoryId", "cat-1")
    })

    expect(result.current.filters.categoryId).toBe("cat-1")

    act(() => {
      result.current.updateFilter("minAmount", 1000)
    })

    expect(result.current.filters.categoryId).toBe("cat-1")
    expect(result.current.filters.minAmount).toBe(1000)
  })

  test("should remove single filter field", () => {
    const { result } = renderHook(() => useCostFilters({ categoryId: "cat-1", minAmount: 1000 }))

    act(() => {
      result.current.removeFilter("categoryId")
    })

    expect(result.current.filters.categoryId).toBeUndefined()
    expect(result.current.filters.minAmount).toBe(1000)
  })

  test("should clear all filters and search", () => {
    const { result } = renderHook(() =>
      useCostFilters({ categoryId: "cat-1" }, "test", "amount", "asc")
    )

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toEqual({})
    expect(result.current.searchText).toBe("")
  })

  test("should apply preset filters", () => {
    const { result } = renderHook(() => useCostFilters())

    act(() => {
      result.current.applyPreset({ minAmount: 100000 })
    })

    expect(result.current.filters.minAmount).toBe(100000)
  })

  test("should merge preset with existing filters", () => {
    const { result } = renderHook(() => useCostFilters({ categoryId: "cat-1" }))

    act(() => {
      result.current.applyPreset({ minAmount: 100000 })
    })

    expect(result.current.filters).toEqual({
      categoryId: "cat-1",
      minAmount: 100000,
    })
  })
})
