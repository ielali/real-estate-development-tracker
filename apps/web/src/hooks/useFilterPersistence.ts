/**
 * Custom hook for persisting filter state in sessionStorage
 *
 * Automatically saves and restores filter preferences scoped by project.
 * Handles serialization of Date objects and maintains separate state per project.
 */

import { useEffect } from "react"
import type { CostFilters, SortOption, SortDirection } from "@/lib/utils/cost-filters"

interface FilterState {
  filters: CostFilters
  searchText: string
  sortBy: SortOption
  sortDirection: SortDirection
}

/**
 * Serialize filter state for storage
 * Converts Date objects to ISO strings
 */
function serializeFilterState(state: FilterState): string {
  const serializable = {
    ...state,
    filters: {
      ...state.filters,
      startDate: state.filters.startDate?.toISOString(),
      endDate: state.filters.endDate?.toISOString(),
    },
  }
  return JSON.stringify(serializable)
}

/**
 * Deserialize filter state from storage
 * Converts ISO strings back to Date objects
 */
function deserializeFilterState(json: string): FilterState | null {
  try {
    const parsed = JSON.parse(json)
    return {
      ...parsed,
      filters: {
        ...parsed.filters,
        startDate: parsed.filters.startDate ? new Date(parsed.filters.startDate) : undefined,
        endDate: parsed.filters.endDate ? new Date(parsed.filters.endDate) : undefined,
      },
    }
  } catch {
    return null
  }
}

/**
 * Get storage key scoped to project
 */
function getStorageKey(projectId: string): string {
  return `cost-filters-${projectId}`
}

/**
 * Hook to persist filter state in sessionStorage
 *
 * @param projectId - Project ID to scope storage
 * @param filters - Current filter state
 * @param searchText - Current search text
 * @param sortBy - Current sort field
 * @param sortDirection - Current sort direction
 * @returns Saved filter state from sessionStorage (if any)
 */
export function useFilterPersistence(
  projectId: string,
  filters: CostFilters,
  searchText: string,
  sortBy: SortOption,
  sortDirection: SortDirection
): FilterState | null {
  const storageKey = getStorageKey(projectId)

  // Save filter state on change
  useEffect(() => {
    if (typeof window === "undefined") return

    const state: FilterState = {
      filters,
      searchText,
      sortBy,
      sortDirection,
    }

    sessionStorage.setItem(storageKey, serializeFilterState(state))
  }, [filters, searchText, sortBy, sortDirection, storageKey])

  // This hook doesn't need to return saved state since it's only for persistence
  // Use loadSavedFilters() function to retrieve saved state
  return null
}

/**
 * Load saved filter state from sessionStorage
 *
 * @param projectId - Project ID to scope storage
 * @returns Saved filter state or null if none exists
 */
export function loadSavedFilters(projectId: string): FilterState | null {
  if (typeof window === "undefined") return null

  const storageKey = getStorageKey(projectId)
  const saved = sessionStorage.getItem(storageKey)

  if (!saved) return null

  return deserializeFilterState(saved)
}

/**
 * Clear saved filter state for a project
 *
 * @param projectId - Project ID to clear storage for
 */
export function clearSavedFilters(projectId: string): void {
  if (typeof window === "undefined") return

  const storageKey = getStorageKey(projectId)
  sessionStorage.removeItem(storageKey)
}
