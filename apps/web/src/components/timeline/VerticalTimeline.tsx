"use client"

/**
 * Vertical Timeline Component (Mobile)
 *
 * Mobile-optimized vertical timeline showing phases as stacked cards
 * instead of horizontal Gantt chart.
 *
 * Features:
 * - Vertical card layout for each phase
 * - Phase badge, name, dates, and duration
 * - Horizontal progress bar within card
 * - Milestones listed below phase
 * - Today marker as card highlight or icon
 * - Touch-friendly interactions
 */

import type { Timeline, Phase, Milestone } from "@/lib/timeline-calculations"
import { getMilestonesForPhase } from "@/lib/timeline-calculations"
import {
  getPhaseColor,
  getMilestoneIcon,
  STATUS_LABELS,
  getStatusLabel,
} from "@/lib/timeline-config"
import { formatDate, formatDateRange, formatDuration } from "@/lib/timeline-utils"

export interface VerticalTimelineProps {
  timeline: Timeline
  onPhaseClick?: (phase: Phase) => void
  onMilestoneClick?: (milestone: Milestone) => void
}

export function VerticalTimeline({
  timeline,
  onPhaseClick,
  onMilestoneClick,
}: VerticalTimelineProps) {
  const today = new Date()

  const isPhaseToday = (phase: Phase) => {
    const start = new Date(phase.startDate)
    const end = new Date(phase.endDate)
    return today >= start && today <= end
  }

  return (
    <div className="space-y-4">
      {timeline.phases.map((phase) => {
        const milestones = getMilestonesForPhase(phase.id, timeline.milestones)
        const colors = getPhaseColor(phase.phaseNumber)
        const isToday = isPhaseToday(phase)
        const statusLabel = getStatusLabel(phase.status, phase.progress)
        const statusClass = STATUS_LABELS[phase.status].class

        return (
          <div
            key={phase.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden ${
              isToday
                ? "border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => onPhaseClick?.(phase)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onPhaseClick) {
                onPhaseClick(phase)
              }
            }}
          >
            <div className="p-4">
              {/* Phase Header */}
              <div className="flex items-center gap-2 mb-3">
                {/* Phase Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded ${colors.badge}`}>
                  {colors.label}
                </span>

                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {phase.name}
                  </div>
                  <div className={`text-xs mt-0.5 ${statusClass}`}>{statusLabel}</div>
                </div>

                {/* Today Indicator */}
                {isToday && (
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-semibold">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </div>
                    <span>TODAY</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {formatDateRange(phase.startDate, phase.endDate)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                Duration: {formatDuration(phase.startDate, phase.endDate)}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {phase.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${colors.bar}`}
                    style={{ width: `${phase.progress}%` }}
                    role="progressbar"
                    aria-valuenow={phase.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Phase progress: ${phase.progress}%`}
                  />
                </div>
              </div>

              {/* Milestones */}
              {milestones.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Milestones
                  </div>
                  <div className="space-y-2">
                    {milestones.map((milestone) => {
                      const icon = getMilestoneIcon(milestone.status)

                      return (
                        <div
                          key={milestone.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onMilestoneClick?.(milestone)
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && onMilestoneClick) {
                              e.stopPropagation()
                              onMilestoneClick(milestone)
                            }
                          }}
                        >
                          {/* Milestone Icon */}
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(milestone.date)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {timeline.phases.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No phases to display
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add phases to see the timeline visualization
          </p>
        </div>
      )}
    </div>
  )
}
