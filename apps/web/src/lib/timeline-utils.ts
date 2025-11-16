/**
 * Timeline Utilities
 *
 * Helper functions for timeline visualization including:
 * - Date formatting
 * - Month generation
 * - Timeline filtering
 * - View scaling
 */

import {
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachQuarterOfInterval,
  format,
  isThisMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
} from "date-fns"
import type { Phase, Milestone, Project } from "./timeline-calculations"

/**
 * Timeline View Type
 */
export type TimelineView = "monthly" | "weekly" | "quarterly"

/**
 * Timeline Filter Options
 */
export interface TimelineFilters {
  showComplete: boolean
  showInProgress: boolean
  showUpcoming: boolean
  showPlanned: boolean
}

/**
 * Month Header Data
 */
export interface MonthHeader {
  date: Date
  label: string
  isCurrentMonth: boolean
}

/**
 * Generate month headers for the timeline
 *
 * @param project - Project boundaries
 * @returns Array of month header data
 */
export function generateMonthHeaders(project: Project): MonthHeader[] {
  const start = parseISO(project.startDate)
  const end = parseISO(project.endDate)

  const months = eachMonthOfInterval({ start, end })

  return months.map((month) => ({
    date: month,
    label: format(month, "MMM yyyy"),
    isCurrentMonth: isThisMonth(month),
  }))
}

/**
 * Generate week headers for the timeline
 *
 * @param project - Project boundaries
 * @returns Array of week header data
 */
export function generateWeekHeaders(project: Project): MonthHeader[] {
  const start = startOfWeek(parseISO(project.startDate))
  const end = endOfWeek(parseISO(project.endDate))

  const weeks = eachWeekOfInterval({ start, end })

  return weeks.map((week) => ({
    date: week,
    label: format(week, "MMM d"),
    isCurrentMonth: isThisMonth(week),
  }))
}

/**
 * Generate quarter headers for the timeline
 *
 * @param project - Project boundaries
 * @returns Array of quarter header data
 */
export function generateQuarterHeaders(project: Project): MonthHeader[] {
  const start = startOfQuarter(parseISO(project.startDate))
  const end = endOfQuarter(parseISO(project.endDate))

  const quarters = eachQuarterOfInterval({ start, end })

  return quarters.map((quarter) => ({
    date: quarter,
    label: format(quarter, "QQQ yyyy"),
    isCurrentMonth: isThisMonth(quarter),
  }))
}

/**
 * Generate headers based on view type
 *
 * @param project - Project boundaries
 * @param view - Timeline view type
 * @returns Array of header data
 */
export function generateHeaders(project: Project, view: TimelineView): MonthHeader[] {
  switch (view) {
    case "weekly":
      return generateWeekHeaders(project)
    case "quarterly":
      return generateQuarterHeaders(project)
    case "monthly":
    default:
      return generateMonthHeaders(project)
  }
}

/**
 * Filter phases based on filter criteria
 *
 * @param phases - All phases
 * @param filters - Filter options
 * @returns Filtered array of phases
 */
export function filterPhases(phases: Phase[], filters: TimelineFilters): Phase[] {
  return phases.filter((phase) => {
    switch (phase.status) {
      case "complete":
        return filters.showComplete
      case "in-progress":
        return filters.showInProgress
      case "upcoming":
        return filters.showUpcoming
      case "planned":
        return filters.showPlanned
      default:
        return true
    }
  })
}

/**
 * Filter milestones based on visible phases
 *
 * @param milestones - All milestones
 * @param visiblePhases - Phases that are currently visible
 * @returns Filtered array of milestones
 */
export function filterMilestones(milestones: Milestone[], visiblePhases: Phase[]): Milestone[] {
  const visiblePhaseIds = new Set(visiblePhases.map((p) => p.id))
  return milestones.filter((m) => visiblePhaseIds.has(m.phaseId))
}

/**
 * Format date for display
 *
 * @param dateString - ISO date string
 * @param formatString - Date format (default: "MMM d, yyyy")
 * @returns Formatted date string
 */
export function formatDate(dateString: string, formatString = "MMM d, yyyy"): string {
  return format(parseISO(dateString), formatString)
}

/**
 * Format date range
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @returns Formatted date range (e.g., "Jan 1, 2025 - Dec 31, 2025")
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

/**
 * Calculate duration in human-readable format
 *
 * @param startDate - ISO start date string
 * @param endDate - ISO end date string
 * @returns Human-readable duration (e.g., "3 months", "2 weeks", "45 days")
 */
export function formatDuration(startDate: string, endDate: string): string {
  const start = parseISO(startDate)
  const end = parseISO(endDate)

  const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const weeks = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"}`
  } else if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`
  } else {
    return `${days} ${days === 1 ? "day" : "days"}`
  }
}

/**
 * Get default filter state (all visible)
 *
 * @returns Default filter configuration
 */
export function getDefaultFilters(): TimelineFilters {
  return {
    showComplete: true,
    showInProgress: true,
    showUpcoming: true,
    showPlanned: true,
  }
}

/**
 * Check if any filters are active (not all visible)
 *
 * @param filters - Current filter configuration
 * @returns True if any filters are hiding content
 */
export function hasActiveFilters(filters: TimelineFilters): boolean {
  return !(
    filters.showComplete &&
    filters.showInProgress &&
    filters.showUpcoming &&
    filters.showPlanned
  )
}
