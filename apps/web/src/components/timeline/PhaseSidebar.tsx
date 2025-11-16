"use client"

/**
 * Phase Sidebar Component
 *
 * Displays phase information in the left sidebar of the timeline.
 *
 * Features:
 * - Color-coded phase badge
 * - Phase name
 * - Status label with appropriate color
 * - Hover effects
 */

import type { Phase } from "@/lib/timeline-calculations"
import { getPhaseColor, getStatusLabel, STATUS_LABELS } from "@/lib/timeline-config"

export interface PhaseSidebarProps {
  phase: Phase
  onClick?: () => void
}

export function PhaseSidebar({ phase, onClick }: PhaseSidebarProps) {
  const colors = getPhaseColor(phase.phaseNumber)
  const statusLabel = getStatusLabel(phase.status, phase.progress)
  const statusClass = STATUS_LABELS[phase.status].class

  return (
    <div
      className="px-6 py-2 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onClick) {
          onClick()
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Phase Badge */}
        <span className={`px-2 py-1 text-xs font-medium rounded ${colors.badge}`}>
          {colors.label}
        </span>

        {/* Phase Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {phase.name}
          </div>
          <div className={`text-xs mt-0.5 ${statusClass}`}>{statusLabel}</div>
        </div>
      </div>
    </div>
  )
}
