"use client"

/**
 * Today Marker Component
 *
 * Displays a vertical red line indicating the current date on the timeline.
 * Only shows if today is within the project duration.
 *
 * Features:
 * - Vertical red line spanning full timeline height
 * - "TODAY" label at top
 * - Positioned based on project start/end dates
 * - Z-index above phase bars
 * - Only renders if today is within project boundaries
 */

import type { Project } from "@/lib/timeline-calculations"
import { calculateTodayPosition } from "@/lib/timeline-calculations"

export interface TodayMarkerProps {
  project: Project
}

export function TodayMarker({ project }: TodayMarkerProps) {
  const position = calculateTodayPosition(project)

  // Don't render if today is outside project duration
  if (!position) {
    return null
  }

  return (
    <div
      className="absolute w-0.5 h-full bg-red-500 dark:bg-red-400 z-20 pointer-events-none"
      style={{ left: position }}
      aria-label="Today marker"
      role="presentation"
    >
      {/* TODAY Label */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-semibold text-red-600 dark:text-red-400 drop-shadow-sm">
          TODAY
        </span>
      </div>
    </div>
  )
}
