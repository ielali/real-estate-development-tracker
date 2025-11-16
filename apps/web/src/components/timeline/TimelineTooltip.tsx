"use client"

/**
 * Timeline Tooltip Component
 *
 * Displays detailed information on hover for phases and milestones.
 *
 * Features:
 * - Phase details: name, dates, duration, progress, status
 * - Milestone details: name, date, status, description
 * - Positioned above the hovered element
 * - Smooth fade-in animation
 */

import type { Phase, Milestone } from "@/lib/timeline-calculations"
import { formatDate, formatDateRange, formatDuration } from "@/lib/timeline-utils"
import { getStatusLabel } from "@/lib/timeline-config"

export interface TimelineTooltipProps {
  phase?: Phase
  milestone?: Milestone
  position?: { left: string; top?: string }
}

export function TimelineTooltip({ phase, milestone, position }: TimelineTooltipProps) {
  if (!phase && !milestone) {
    return null
  }

  return (
    <div
      className="absolute z-30 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg text-sm whitespace-nowrap animate-in fade-in duration-200 pointer-events-none"
      style={{
        left: position?.left ?? "50%",
        top: position?.top ?? "-4rem",
        transform: "translateX(-50%)",
      }}
    >
      {/* Phase Tooltip */}
      {phase && (
        <div className="space-y-1">
          <div className="font-semibold">{phase.name}</div>
          <div className="text-xs text-gray-300 dark:text-gray-400">
            {formatDateRange(phase.startDate, phase.endDate)}
          </div>
          <div className="text-xs text-gray-300 dark:text-gray-400">
            Duration: {formatDuration(phase.startDate, phase.endDate)}
          </div>
          <div className="text-xs text-gray-300 dark:text-gray-400">
            Progress: {phase.progress}%
          </div>
          <div className="text-xs text-gray-300 dark:text-gray-400">
            Status: {getStatusLabel(phase.status, phase.progress)}
          </div>
        </div>
      )}

      {/* Milestone Tooltip */}
      {milestone && (
        <div className="space-y-1">
          <div className="font-semibold">{milestone.name}</div>
          <div className="text-xs text-gray-300 dark:text-gray-400">
            Date: {formatDate(milestone.date)}
          </div>
          <div className="text-xs text-gray-300 dark:text-gray-400">Status: {milestone.status}</div>
          {milestone.description && (
            <div className="text-xs text-gray-300 dark:text-gray-400 max-w-xs whitespace-normal">
              {milestone.description}
            </div>
          )}
        </div>
      )}

      {/* Tooltip Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-800" />
    </div>
  )
}
