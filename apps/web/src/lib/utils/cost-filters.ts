/**
 * Cost filtering and search utilities
 *
 * Provides types and helper functions for managing cost filters,
 * search parameters, and quick filter presets.
 */

export type SortOption = "date" | "amount" | "contact" | "category"
export type SortDirection = "asc" | "desc"

/**
 * Cost filter criteria
 */
export interface CostFilters {
  categoryId?: string
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
  contactId?: string
  contactNameSearch?: string
}

/**
 * Quick filter preset definition
 */
export interface FilterPreset {
  id: string
  label: string
  filters: CostFilters
  icon?: React.ReactNode
}

/**
 * Default quick filter presets
 */
export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: "last-30-days",
    label: "Last 30 days",
    filters: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    id: "over-1000",
    label: "Over $1,000",
    filters: {
      minAmount: 100000, // $1000 in cents
    },
  },
  {
    id: "this-month",
    label: "This month",
    filters: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
    },
  },
  // Note: "Unassigned" preset mentioned in story requirements but requires
  // special backend handling for NULL contactId filtering.
  // Recommend using getOrphanedCosts procedure or adding isNull parameter to list schema
]

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: CostFilters, searchText?: string): boolean {
  return (
    !!searchText ||
    !!filters.categoryId ||
    !!filters.startDate ||
    !!filters.endDate ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined ||
    !!filters.contactId ||
    !!filters.contactNameSearch
  )
}

/**
 * Count the number of active filters
 */
export function countActiveFilters(filters: CostFilters, searchText?: string): number {
  let count = 0
  if (searchText) count++
  if (filters.categoryId) count++
  if (filters.startDate || filters.endDate) count++ // Date range counts as one filter
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) count++ // Amount range counts as one filter
  if (filters.contactId) count++
  if (filters.contactNameSearch) count++
  return count
}

/**
 * Clear all filters
 */
export function clearAllFilters(): CostFilters {
  return {}
}

/**
 * Format amount from cents to dollars for display
 */
export function formatAmountForDisplay(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Parse amount from dollars to cents
 */
export function parseAmountToCents(dollars: string): number | undefined {
  const parsed = parseFloat(dollars)
  return isNaN(parsed) ? undefined : Math.round(parsed * 100)
}

/**
 * Generate filter description for display
 */
export function getFilterDescription(filters: CostFilters, searchText?: string): string[] {
  const descriptions: string[] = []

  if (searchText) {
    descriptions.push(`Search: "${searchText}"`)
  }

  if (filters.startDate || filters.endDate) {
    if (filters.startDate && filters.endDate) {
      descriptions.push(
        `Date: ${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`
      )
    } else if (filters.startDate) {
      descriptions.push(`After: ${filters.startDate.toLocaleDateString()}`)
    } else if (filters.endDate) {
      descriptions.push(`Before: ${filters.endDate.toLocaleDateString()}`)
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
      descriptions.push(
        `Amount: $${formatAmountForDisplay(filters.minAmount)} - $${formatAmountForDisplay(filters.maxAmount)}`
      )
    } else if (filters.minAmount !== undefined) {
      descriptions.push(`Min: $${formatAmountForDisplay(filters.minAmount)}`)
    } else if (filters.maxAmount !== undefined) {
      descriptions.push(`Max: $${formatAmountForDisplay(filters.maxAmount)}`)
    }
  }

  if (filters.contactNameSearch) {
    descriptions.push(`Contact: "${filters.contactNameSearch}"`)
  }

  return descriptions
}
