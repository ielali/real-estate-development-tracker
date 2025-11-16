"use client"

/**
 * Timeline Filters Component
 *
 * Filter modal/dropdown for showing/hiding phases by status.
 *
 * Features:
 * - Checkboxes for each phase status
 * - Apply/Reset buttons
 * - Persists filter state
 */

import { useState } from "react"
import { X } from "lucide-react"
import type { TimelineFilters as Filters } from "@/lib/timeline-utils"

export interface TimelineFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onClose: () => void
}

export function TimelineFilters({ filters, onFiltersChange, onClose }: TimelineFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    const defaultFilters: Filters = {
      showComplete: true,
      showInProgress: true,
      showUpcoming: true,
      showPlanned: true,
    }
    setLocalFilters(defaultFilters)
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter Timeline</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Options */}
      <div className="px-4 py-3 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.showComplete}
            onChange={(e) => setLocalFilters({ ...localFilters, showComplete: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Complete</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.showInProgress}
            onChange={(e) => setLocalFilters({ ...localFilters, showInProgress: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show In Progress</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.showUpcoming}
            onChange={(e) => setLocalFilters({ ...localFilters, showUpcoming: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Upcoming</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.showPlanned}
            onChange={(e) => setLocalFilters({ ...localFilters, showPlanned: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Planned</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
