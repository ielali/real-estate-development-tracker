"use client"

/**
 * Timeline Header Component
 *
 * Displays month/week/quarter headers across the top of the Gantt timeline.
 * Headers are sticky and highlight the current period.
 *
 * Features:
 * - Monthly, weekly, or quarterly view support
 * - Current month/period highlighting
 * - Sticky header on scroll
 * - Responsive layout (fewer periods visible on mobile)
 */

import type { Project } from "@/lib/timeline-calculations"
import { generateHeaders, type TimelineView } from "@/lib/timeline-utils"

export interface TimelineHeaderProps {
  project: Project
  view?: TimelineView
  sidebarWidth?: string // Width of left sidebar (e.g., "16rem")
}

export function TimelineHeader({
  project,
  view = "monthly",
  sidebarWidth = "16rem",
}: TimelineHeaderProps) {
  const headers = generateHeaders(project, view)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
      <div className="flex">
        {/* Left Sidebar Spacer */}
        <div
          className="px-6 py-4 border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
          style={{ width: sidebarWidth }}
        >
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Phase / Milestone
          </span>
        </div>

        {/* Timeline Headers */}
        <div className="flex-1 flex overflow-x-auto">
          {headers.map((header, index) => (
            <div
              key={index}
              className={`flex-1 min-w-[100px] lg:min-w-[120px] px-4 py-4 border-r border-gray-200 dark:border-gray-700 text-center ${
                header.isCurrentMonth
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-gray-50 dark:bg-gray-900"
              }`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  header.isCurrentMonth
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {header.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
