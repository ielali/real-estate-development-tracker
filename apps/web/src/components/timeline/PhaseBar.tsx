"use client"

/**
 * Phase Bar Component
 *
 * Displays a horizontal bar representing a phase's duration and progress
 * on the Gantt timeline.
 *
 * Features:
 * - Color-coded by phase number (purple, blue, green, yellow, indigo)
 * - Status-based opacity (solid for active, faded for upcoming/planned)
 * - Progress percentage displayed inside bar
 * - Right edge indicator for in-progress phases
 * - Hover effects and tooltip trigger
 * - GPU-accelerated positioning with CSS transforms
 */

import type { Phase, Project } from "@/lib/timeline-calculations"
import { calculatePhasePosition, shouldShowRightEdge } from "@/lib/timeline-calculations"
import { getPhaseColor, PHASE_BAR_STYLES } from "@/lib/timeline-config"

export interface PhaseBarProps {
  phase: Phase
  project: Project
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PhaseBar({ phase, project, onClick, onMouseEnter, onMouseLeave }: PhaseBarProps) {
  const { left, width } = calculatePhasePosition(phase, project)
  const colors = getPhaseColor(phase.phaseNumber)
  const hasRightEdge = shouldShowRightEdge(phase)
  const statusOpacity = PHASE_BAR_STYLES[phase.status]

  return (
    <div className="relative h-8 py-1" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div
        className={`absolute h-6 rounded shadow-sm cursor-pointer transition-all duration-300 hover:brightness-110 hover:scale-105 ${colors.bar} ${statusOpacity}`}
        style={{ left, width }}
        onClick={onClick}
        role="img"
        aria-label={`${phase.name}: ${phase.startDate} to ${phase.endDate}, ${phase.progress}% complete, ${phase.status}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onClick) {
            onClick()
          }
        }}
      >
        {/* Progress Percentage Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white drop-shadow-sm">{phase.progress}%</span>
        </div>

        {/* Right Edge Indicator (In Progress) */}
        {hasRightEdge && (
          <div
            className={`absolute right-0 top-0 bottom-0 w-1 ${colors.bar.replace("bg-", "bg-").replace("-500", "-700").replace("-300", "-500")}`}
          />
        )}
      </div>
    </div>
  )
}
