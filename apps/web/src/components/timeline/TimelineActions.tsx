"use client"

/**
 * Timeline Actions Component
 *
 * Action buttons for timeline:
 * - Filter button (show/hide phases by status)
 * - View selector (monthly, weekly, quarterly)
 * - Add Event button
 *
 * Features:
 * - Dropdown for view selection
 * - Modal for filters
 * - Navigation to event creation
 */

import { useState } from "react"
import { Filter, ChevronDown, Plus } from "lucide-react"
import type { TimelineView, TimelineFilters as Filters } from "@/lib/timeline-utils"
import { hasActiveFilters } from "@/lib/timeline-utils"
import { TimelineFilters } from "./TimelineFilters"

export interface TimelineActionsProps {
  view: TimelineView
  onViewChange: (view: TimelineView) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onAddEvent?: () => void
  projectId?: string
}

export function TimelineActions({
  view,
  onViewChange,
  filters,
  onFiltersChange,
  onAddEvent,
}: TimelineActionsProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showViewSelector, setShowViewSelector] = useState(false)

  const viewLabels: Record<TimelineView, string> = {
    monthly: "Monthly",
    weekly: "Weekly",
    quarterly: "Quarterly",
  }

  return (
    <div className="flex items-center gap-3">
      {/* View Selector */}
      <div className="relative">
        <button
          onClick={() => setShowViewSelector(!showViewSelector)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <span>{viewLabels[view]}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showViewSelector && (
          <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            <button
              onClick={() => {
                onViewChange("monthly")
                setShowViewSelector(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg ${
                view === "monthly"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => {
                onViewChange("weekly")
                setShowViewSelector(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                view === "weekly"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => {
                onViewChange("quarterly")
                setShowViewSelector(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors last:rounded-b-lg ${
                view === "quarterly"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Quarterly View
            </button>
          </div>
        )}

        {/* Click outside to close */}
        {showViewSelector && (
          <div className="fixed inset-0 z-40" onClick={() => setShowViewSelector(false)} />
        )}
      </div>

      {/* Filter Button */}
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors flex items-center gap-2 ${
            hasActiveFilters(filters)
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          {hasActiveFilters(filters) && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-full">
              •
            </span>
          )}
        </button>

        {showFilters && (
          <TimelineFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Click outside to close */}
        {showFilters && (
          <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
        )}
      </div>

      {/* Add Event Button */}
      {onAddEvent && (
        <button
          onClick={onAddEvent}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      )}
    </div>
  )
}
