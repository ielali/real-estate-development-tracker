"use client"

/**
 * Milestone Marker Component
 *
 * Displays a circular marker positioned at a specific date on the timeline.
 *
 * Features:
 * - Positioned at milestone date
 * - Color-coded by phase
 * - Status-based styling (solid for complete, ring for upcoming)
 * - Shadow for depth
 * - Hover effects
 */

import type { Milestone, Project, Phase } from "@/lib/timeline-calculations"
import { calculateMilestonePosition } from "@/lib/timeline-calculations"
import { getPhaseColor } from "@/lib/timeline-config"

export interface MilestoneMarkerProps {
  milestone: Milestone
  project: Project
  phase: Phase
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MilestoneMarker({
  milestone,
  project,
  phase,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MilestoneMarkerProps) {
  const position = calculateMilestonePosition(milestone.date, project)
  const colors = getPhaseColor(phase.phaseNumber)

  if (!position) {
    return null
  }

  const getMarkerStyle = () => {
    if (milestone.status === "complete") {
      return `${colors.marker} shadow-md`
    }
    return "bg-gray-400 dark:bg-gray-500 ring-2 ring-white dark:ring-gray-800 shadow-md"
  }

  return (
    <div className="relative h-6" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div
        className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-125 ${getMarkerStyle()}`}
        style={{ left: position, top: "6px", transform: "translateX(-50%)" }}
        onClick={onClick}
        role="img"
        aria-label={`Milestone: ${milestone.name} on ${milestone.date}, ${milestone.status}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onClick) {
            onClick()
          }
        }}
      />
    </div>
  )
}
