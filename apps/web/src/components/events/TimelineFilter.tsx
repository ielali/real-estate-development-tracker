"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimelineFilterProps {
  categoryId?: string
  onCategoryChange: (categoryId: string | undefined) => void
  contactId?: string
  onContactChange: (contactId: string | undefined) => void
  startDate?: Date
  endDate?: Date
  onDateRangeChange: (startDate: Date | undefined, endDate: Date | undefined) => void
}

/**
 * TimelineFilter - Filter controls for timeline view
 *
 * Provides filtering by event category, contact, and date range.
 * Shows active filters as badges with clear option.
 *
 * Mobile-optimized with:
 * - Touch-friendly controls
 * - Responsive layout (stacks on mobile)
 * - Clear visual feedback for active filters
 *
 * @param categoryId - Currently selected category filter
 * @param onCategoryChange - Callback when category filter changes
 * @param contactId - Currently selected contact filter
 * @param onContactChange - Callback when contact filter changes
 * @param startDate - Start date for date range filter
 * @param endDate - End date for date range filter
 * @param onDateRangeChange - Callback when date range changes
 */
export function TimelineFilter({
  categoryId,
  onCategoryChange,
  contactId,
  onContactChange,
  startDate,
  endDate,
  onDateRangeChange,
}: TimelineFilterProps) {
  const hasActiveFilters = categoryId || contactId || startDate || endDate

  const clearAllFilters = () => {
    onCategoryChange(undefined)
    onContactChange(undefined)
    onDateRangeChange(undefined, undefined)
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Event Type</label>
          <Select
            value={categoryId || "all"}
            onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="milestone">Milestones</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="inspection">Inspections</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Future: Contact filter */}
        {/* <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Contact</label>
          <ContactSelect
            projectId={projectId}
            value={contactId}
            onChange={onContactChange}
            placeholder="All contacts"
          />
        </div> */}

        {/* Future: Date range picker */}
        {/* <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={onDateRangeChange}
          />
        </div> */}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {categoryId && (
            <Badge variant="secondary" className="gap-1">
              Type: {categoryId}
              <button
                onClick={() => onCategoryChange(undefined)}
                className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                aria-label="Remove category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {contactId && (
            <Badge variant="secondary" className="gap-1">
              Contact
              <button
                onClick={() => onContactChange(undefined)}
                className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                aria-label="Remove contact filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date range
              <button
                onClick={() => onDateRangeChange(undefined, undefined)}
                className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                aria-label="Remove date range filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto py-1 px-2 text-sm"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
