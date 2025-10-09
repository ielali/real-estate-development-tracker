/**
 * SearchAndFilter - Main search and filter component for costs
 *
 * Provides comprehensive search, filtering, and sorting capabilities:
 * - Debounced text search (300ms)
 * - Date range filtering
 * - Amount range filtering
 * - Category filtering
 * - Contact filtering
 * - Sort options with direction
 * - Quick filter presets
 * - Active filter badges
 * - Mobile-responsive design
 */

"use client"

import React, { useState } from "react"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { AmountRangeInput } from "./AmountRangeInput"
import { QuickFilterPresets } from "./QuickFilterPresets"
import { ActiveFilters } from "./ActiveFilters"
import { useDebounce } from "@/hooks/useDebounce"
import type { CostFilters, SortOption, SortDirection } from "@/lib/utils/cost-filters"
import { countActiveFilters } from "@/lib/utils/cost-filters"

export interface SearchAndFilterProps {
  projectId: string
  filters: CostFilters
  searchText: string
  sortBy: SortOption
  sortDirection: SortDirection
  resultCount?: number
  onFilterChange: (filters: CostFilters) => void
  onSearchChange: (searchText: string) => void
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void
  onClearAll: () => void
  categories?: Array<{ id: string; displayName: string }>
  contacts?: Array<{ id: string; firstName: string; lastName?: string | null }>
}

export function SearchAndFilter({
  filters,
  searchText,
  sortBy,
  sortDirection,
  resultCount,
  onFilterChange,
  onSearchChange,
  onSortChange,
  onClearAll,
  categories = [],
  contacts = [],
}: SearchAndFilterProps) {
  const [localSearchText, setLocalSearchText] = useState(searchText)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Debounce search input
  const debouncedSearch = useDebounce(localSearchText, 300)

  // Update parent when debounced value changes
  // Use useEffect to avoid state updates during render
  React.useEffect(() => {
    if (debouncedSearch !== searchText) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchText, onSearchChange])

  const filterCount = countActiveFilters(filters, searchText)

  const handleFilterUpdate = <K extends keyof CostFilters>(key: K, value: CostFilters[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    })
  }

  const handleRemoveFilter = <K extends keyof CostFilters>(key: K) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFilterChange(newFilters)
  }

  const handleClearSearch = () => {
    setLocalSearchText("")
    onSearchChange("")
  }

  const handleSortChange = (value: string) => {
    const [newSortBy, newDirection] = value.split("-") as [SortOption, SortDirection]
    onSortChange(newSortBy, newDirection)
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search costs by description..."
            value={localSearchText}
            onChange={(e) => setLocalSearchText(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Search costs"
          />
          {localSearchText && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <Select value={`${sortBy}-${sortDirection}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (newest first)</SelectItem>
            <SelectItem value="date-asc">Date (oldest first)</SelectItem>
            <SelectItem value="amount-desc">Amount (high to low)</SelectItem>
            <SelectItem value="amount-asc">Amount (low to high)</SelectItem>
            <SelectItem value="contact-asc">Contact (A-Z)</SelectItem>
            <SelectItem value="contact-desc">Contact (Z-A)</SelectItem>
            <SelectItem value="category-asc">Category (A-Z)</SelectItem>
            <SelectItem value="category-desc">Category (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Popover open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {filterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {filterCount}
                </span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Refine your search with additional filters
                </p>
              </div>

              <Separator />

              {/* Quick Filter Presets */}
              <QuickFilterPresets
                onPresetSelect={(preset) => {
                  onFilterChange({
                    ...filters,
                    ...preset.filters,
                  })
                }}
              />

              <Separator />

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={filters.categoryId ?? "__all__"}
                    onValueChange={(value) =>
                      handleFilterUpdate("categoryId", value === "__all__" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={filters.startDate?.toISOString().split("T")[0] ?? ""}
                      onChange={(e) =>
                        handleFilterUpdate(
                          "startDate",
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={filters.endDate?.toISOString().split("T")[0] ?? ""}
                      onChange={(e) =>
                        handleFilterUpdate(
                          "endDate",
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Amount Range Filter */}
              <AmountRangeInput
                minAmount={filters.minAmount}
                maxAmount={filters.maxAmount}
                onMinChange={(value) => handleFilterUpdate("minAmount", value)}
                onMaxChange={(value) => handleFilterUpdate("maxAmount", value)}
              />

              {/* Contact Filter */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Select
                    value={filters.contactId ?? "__all__"}
                    onValueChange={(value) =>
                      handleFilterUpdate("contactId", value === "__all__" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All contacts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All contacts</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.firstName}
                          {contact.lastName ? ` ${contact.lastName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Contact Name Search */}
              <div className="space-y-2">
                <Label htmlFor="contact-search">Search Contact Name</Label>
                <Input
                  id="contact-search"
                  type="text"
                  placeholder="Search by contact name..."
                  value={filters.contactNameSearch ?? ""}
                  onChange={(e) =>
                    handleFilterUpdate("contactNameSearch", e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={filters}
        searchText={searchText}
        onRemoveFilter={handleRemoveFilter}
        onClearSearch={handleClearSearch}
        onClearAll={onClearAll}
      />

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          Found {resultCount} cost{resultCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}
