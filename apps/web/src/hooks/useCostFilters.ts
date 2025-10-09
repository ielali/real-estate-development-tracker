/**
 * Custom hook for managing cost filter state
 *
 * Provides centralized state management for cost search, filters, and sorting.
 * Integrates with session persistence for filter state restoration.
 */

import { useState, useCallback } from "react"
import type { CostFilters, SortOption, SortDirection } from "@/lib/utils/cost-filters"
import { clearAllFilters } from "@/lib/utils/cost-filters"

export interface UseCostFiltersReturn {
  filters: CostFilters
  searchText: string
  sortBy: SortOption
  sortDirection: SortDirection
  setFilters: (filters: CostFilters) => void
  setSearchText: (text: string) => void
  setSortBy: (sortBy: SortOption) => void
  setSortDirection: (direction: SortDirection) => void
  updateFilter: <K extends keyof CostFilters>(key: K, value: CostFilters[K]) => void
  removeFilter: <K extends keyof CostFilters>(key: K) => void
  clearFilters: () => void
  applyPreset: (presetFilters: CostFilters) => void
}

export function useCostFilters(
  initialFilters: CostFilters = {},
  initialSearchText = "",
  initialSortBy: SortOption = "date",
  initialSortDirection: SortDirection = "desc"
): UseCostFiltersReturn {
  const [filters, setFilters] = useState<CostFilters>(initialFilters)
  const [searchText, setSearchText] = useState(initialSearchText)
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection)

  /**
   * Update a single filter field
   */
  const updateFilter = useCallback(<K extends keyof CostFilters>(key: K, value: CostFilters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  /**
   * Remove a specific filter
   */
  const removeFilter = useCallback(<K extends keyof CostFilters>(key: K) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  /**
   * Clear all filters and search
   */
  const clearFiltersHandler = useCallback(() => {
    setFilters(clearAllFilters())
    setSearchText("")
  }, [])

  /**
   * Apply a quick filter preset
   * Merges preset filters with existing filters
   */
  const applyPreset = useCallback((presetFilters: CostFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...presetFilters,
    }))
  }, [])

  return {
    filters,
    searchText,
    sortBy,
    sortDirection,
    setFilters,
    setSearchText,
    setSortBy,
    setSortDirection,
    updateFilter,
    removeFilter,
    clearFilters: clearFiltersHandler,
    applyPreset,
  }
}
