"use client"

/**
 * Milestone Sidebar Component
 *
 * Displays milestone information in the left sidebar of the timeline.
 *
 * Features:
 * - Indented from phases
 * - Status icon (checkmark, clock, clipboard)
 * - Milestone name
 * - Date label
 * - Phase color tint background
 * - Hover effects
 */

import type { Milestone, Phase } from "@/lib/timeline-calculations"
import { getMilestoneIcon, getPhaseColor } from "@/lib/timeline-config"
import { formatDate } from "@/lib/timeline-utils"

export interface MilestoneSidebarProps {
  milestone: Milestone
  phase: Phase
  onClick?: () => void
}

export function MilestoneSidebar({ milestone, phase, onClick }: MilestoneSidebarProps) {
  const icon = getMilestoneIcon(milestone.status)
  const colors = getPhaseColor(phase.phaseNumber)

  return (
    <div
      className={`px-6 py-2 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${colors.bg}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onClick) {
          onClick()
        }
      }}
    >
      <div className="flex items-center gap-3 ml-8">
        {/* Status Icon */}
        <svg
          className={`w-5 h-5 flex-shrink-0 ${icon.class}`}
          fill="currentColor"
          viewBox={icon.viewBox}
          aria-hidden="true"
        >
          <path fillRule="evenodd" d={icon.path} clipRule="evenodd" />
        </svg>

        {/* Milestone Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {milestone.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(milestone.date)}
          </div>
        </div>
      </div>
    </div>
  )
}
