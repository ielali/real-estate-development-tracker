"use client"

/**
 * Timeline Grid Component
 *
 * Main Gantt chart visualization combining:
 * - Timeline header (months/weeks/quarters)
 * - Phase rows with bars
 * - Milestone rows with markers
 * - Today marker
 *
 * Features:
 * - Horizontal scrolling for long timelines
 * - Tooltips on hover
 * - Click handlers for phases and milestones
 * - Responsive layout
 */

import { useState } from "react"
import type { Timeline, Phase, Milestone } from "@/lib/timeline-calculations"
import { getMilestonesForPhase } from "@/lib/timeline-calculations"
import type { TimelineView } from "@/lib/timeline-utils"
import { TimelineHeader } from "./TimelineHeader"
import { PhaseRow } from "./PhaseRow"
import { MilestoneRow } from "./MilestoneRow"
import { TodayMarker } from "./TodayMarker"
import { TimelineTooltip } from "./TimelineTooltip"

export interface TimelineGridProps {
  timeline: Timeline
  view?: TimelineView
  sidebarWidth?: string
  onPhaseClick?: (phase: Phase) => void
  onMilestoneClick?: (milestone: Milestone) => void
}

export function TimelineGrid({
  timeline,
  view = "monthly",
  sidebarWidth = "16rem",
  onPhaseClick,
  onMilestoneClick,
}: TimelineGridProps) {
  const [hoveredPhase, setHoveredPhase] = useState<Phase | null>(null)
  const [hoveredMilestone, setHoveredMilestone] = useState<Milestone | null>(null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Timeline Header */}
      <TimelineHeader project={timeline.project} view={view} sidebarWidth={sidebarWidth} />

      {/* Timeline Body */}
      <div className="relative overflow-x-auto">
        {/* Today Marker (positioned absolutely) */}
        <div
          className="relative"
          style={{ minHeight: `${(timeline.phases.length + timeline.milestones.length) * 2}rem` }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative h-full" style={{ paddingLeft: sidebarWidth }}>
              <TodayMarker project={timeline.project} />
            </div>
          </div>

          {/* Phase and Milestone Rows */}
          {timeline.phases.map((phase) => {
            const milestones = getMilestonesForPhase(phase.id, timeline.milestones)

            return (
              <div key={phase.id}>
                {/* Phase Row */}
                <PhaseRow
                  phase={phase}
                  project={timeline.project}
                  sidebarWidth={sidebarWidth}
                  onClick={() => onPhaseClick?.(phase)}
                  onMouseEnter={() => setHoveredPhase(phase)}
                  onMouseLeave={() => setHoveredPhase(null)}
                />

                {/* Milestone Rows */}
                {milestones.map((milestone) => (
                  <MilestoneRow
                    key={milestone.id}
                    milestone={milestone}
                    project={timeline.project}
                    phase={phase}
                    sidebarWidth={sidebarWidth}
                    onClick={() => onMilestoneClick?.(milestone)}
                    onMouseEnter={() => setHoveredMilestone(milestone)}
                    onMouseLeave={() => setHoveredMilestone(null)}
                  />
                ))}
              </div>
            )
          })}

          {/* Empty State */}
          {timeline.phases.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <p className="text-sm font-medium">No phases to display</p>
                <p className="text-xs mt-1">Add phases to see the timeline visualization</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltips (rendered conditionally on hover) */}
      {hoveredPhase && <TimelineTooltip phase={hoveredPhase} />}
      {hoveredMilestone && <TimelineTooltip milestone={hoveredMilestone} />}
    </div>
  )
}
