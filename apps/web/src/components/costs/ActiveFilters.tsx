/**
 * ActiveFilters - Display active filter badges with remove actions
 *
 * Shows visual indicators for all active filters with individual
 * remove buttons and a clear all action.
 */

import React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CostFilters } from "@/lib/utils/cost-filters"
import { getFilterDescription } from "@/lib/utils/cost-filters"

export interface ActiveFiltersProps {
  filters: CostFilters
  searchText?: string
  onRemoveFilter: (key: keyof CostFilters) => void
  onClearSearch: () => void
  onClearAll: () => void
}

export function ActiveFilters({
  filters,
  searchText,
  onRemoveFilter,
  onClearSearch,
  onClearAll,
}: ActiveFiltersProps) {
  const descriptions = getFilterDescription(filters, searchText)

  if (descriptions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>

      {searchText && (
        <Badge variant="secondary" className="gap-1">
          Search: "{searchText}"
          <button
            onClick={onClearSearch}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.categoryId && (
        <Badge variant="secondary" className="gap-1">
          Category
          <button
            onClick={() => onRemoveFilter("categoryId")}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Remove category filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {(filters.startDate || filters.endDate) && (
        <Badge variant="secondary" className="gap-1">
          {filters.startDate && filters.endDate
            ? `${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`
            : filters.startDate
              ? `After ${filters.startDate.toLocaleDateString()}`
              : `Before ${filters.endDate?.toLocaleDateString()}`}
          <button
            onClick={() => {
              onRemoveFilter("startDate")
              onRemoveFilter("endDate")
            }}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Remove date filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
        <Badge variant="secondary" className="gap-1">
          {filters.minAmount !== undefined && filters.maxAmount !== undefined
            ? `$${(filters.minAmount / 100).toFixed(2)} - $${(filters.maxAmount / 100).toFixed(2)}`
            : filters.minAmount !== undefined
              ? `Min $${(filters.minAmount / 100).toFixed(2)}`
              : `Max $${(filters.maxAmount! / 100).toFixed(2)}`}
          <button
            onClick={() => {
              onRemoveFilter("minAmount")
              onRemoveFilter("maxAmount")
            }}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Remove amount filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.contactId && (
        <Badge variant="secondary" className="gap-1">
          Contact
          <button
            onClick={() => onRemoveFilter("contactId")}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Remove contact filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.contactNameSearch && (
        <Badge variant="secondary" className="gap-1">
          Contact: "{filters.contactNameSearch}"
          <button
            onClick={() => onRemoveFilter("contactNameSearch")}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label="Remove contact name search"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 px-2 text-xs">
        Clear all
      </Button>
    </div>
  )
}
