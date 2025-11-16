"use client"

/**
 * Milestone Row Component
 *
 * Combines milestone sidebar and milestone marker into a single row.
 */

import type { Milestone, Project, Phase } from "@/lib/timeline-calculations"
import { MilestoneSidebar } from "./MilestoneSidebar"
import { MilestoneMarker } from "./MilestoneMarker"

export interface MilestoneRowProps {
  milestone: Milestone
  project: Project
  phase: Phase
  sidebarWidth?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MilestoneRow({
  milestone,
  project,
  phase,
  sidebarWidth = "16rem",
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MilestoneRowProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {/* Left Sidebar */}
      <div className="flex-shrink-0" style={{ width: sidebarWidth }}>
        <MilestoneSidebar milestone={milestone} phase={phase} onClick={onClick} />
      </div>

      {/* Timeline Marker */}
      <div className="flex-1 relative">
        <MilestoneMarker
          milestone={milestone}
          project={project}
          phase={phase}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  )
}
