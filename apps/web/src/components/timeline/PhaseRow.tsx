"use client"

/**
 * Phase Row Component
 *
 * Combines phase sidebar and phase bar into a single row.
 * This is the main building block for each phase in the timeline.
 */

import type { Phase, Project } from "@/lib/timeline-calculations"
import { PhaseSidebar } from "./PhaseSidebar"
import { PhaseBar } from "./PhaseBar"

export interface PhaseRowProps {
  phase: Phase
  project: Project
  sidebarWidth?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PhaseRow({
  phase,
  project,
  sidebarWidth = "16rem",
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PhaseRowProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {/* Left Sidebar */}
      <div className="flex-shrink-0" style={{ width: sidebarWidth }}>
        <PhaseSidebar phase={phase} onClick={onClick} />
      </div>

      {/* Timeline Bar */}
      <div className="flex-1 relative">
        <PhaseBar
          phase={phase}
          project={project}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  )
}
