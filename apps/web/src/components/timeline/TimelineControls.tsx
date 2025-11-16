"use client"

/**
 * Timeline Controls Component
 *
 * Displays project summary information, overall progress, and today indicator
 * above the Gantt timeline.
 *
 * Features:
 * - Project duration (start - end dates)
 * - Overall progress bar with percentage
 * - Today indicator (pulsing red dot + current date)
 * - Responsive layout (stacks on mobile)
 */

import { format } from "date-fns"
import type { Project } from "@/lib/timeline-calculations"
import { formatDateRange } from "@/lib/timeline-utils"

export interface TimelineControlsProps {
  project: Project
  progress: number // 0-100
}

export function TimelineControls({ project, progress }: TimelineControlsProps) {
  const today = format(new Date(), "MMM d, yyyy")

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        {/* Project Duration */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Project Duration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {formatDateRange(project.startDate, project.endDate)}
          </p>
        </div>

        {/* Vertical Divider (Desktop Only) */}
        <div className="hidden lg:block w-px h-12 bg-gray-200 dark:bg-gray-700" />

        {/* Overall Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Overall Progress
            </h3>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {progress}%
            </span>
          </div>
          <div className="w-full lg:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall project progress: ${progress}%`}
            />
          </div>
        </div>

        {/* Vertical Divider (Desktop Only) */}
        <div className="hidden lg:block w-px h-12 bg-gray-200 dark:bg-gray-700" />

        {/* Today Indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Pulsing Red Dot */}
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{today}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
