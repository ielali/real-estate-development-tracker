/**
 * Timeline Calculations
 *
 * Core calculation utilities for timeline positioning and date math.
 * All positions are calculated as percentages from project start/end.
 *
 * Uses date-fns for reliable date manipulation and timezone handling.
 */

import { differenceInDays, parseISO, isBefore, isAfter } from "date-fns"
import type { PhaseStatus, MilestoneStatus, MilestoneIcon } from "./timeline-config"

/**
 * Phase Data Structure
 */
export interface Phase {
  id: string
  name: string
  phaseNumber: number // 1-5 for color mapping
  startDate: string // ISO date string
  endDate: string // ISO date string
  progress: number // 0-100
  status: PhaseStatus
}

/**
 * Milestone Data Structure
 */
export interface Milestone {
  id: string
  name: string
  date: string // ISO date string
  phaseId: string
  status: MilestoneStatus
  icon: MilestoneIcon
  description?: string
}

/**
 * Project Timeline Boundaries
 */
export interface Project {
  id: string
  name: string
  startDate: string // ISO date string
  endDate: string // ISO date string
}

/**
 * Timeline Data Structure
 */
export interface Timeline {
  project: Project
  phases: Phase[]
  milestones: Milestone[]
}

/**
 * Position Result (left offset and width as percentages)
 */
export interface Position {
  left: string // e.g., "25.5%"
  width: string // e.g., "40.2%"
}

/**
 * Calculate phase bar position and width
 *
 * @param phase - Phase to position
 * @param project - Project boundaries
 * @returns Position object with left offset and width as percentages
 *
 * Edge cases handled:
 * - Phase shorter than 1 day: minimum width of 0.5%
 * - Phase outside project bounds: clamps to project boundaries
 * - Zero-duration project: returns 0% left, 100% width
 */
export function calculatePhasePosition(phase: Phase, project: Project): Position {
  const projectStart = parseISO(project.startDate)
  const projectEnd = parseISO(project.endDate)
  const phaseStart = parseISO(phase.startDate)
  const phaseEnd = parseISO(phase.endDate)

  const projectDuration = differenceInDays(projectEnd, projectStart)

  // Edge case: zero-duration project
  if (projectDuration <= 0) {
    return { left: "0%", width: "100%" }
  }

  // Calculate days from project start
  const phaseStartOffset = differenceInDays(phaseStart, projectStart)
  const phaseDuration = Math.max(differenceInDays(phaseEnd, phaseStart), 0)

  // Convert to percentages
  const left = Math.max(0, Math.min(100, (phaseStartOffset / projectDuration) * 100))
  let width = Math.max(0.5, (phaseDuration / projectDuration) * 100) // Minimum 0.5% width

  // Clamp width to project boundaries
  if (left + width > 100) {
    width = 100 - left
  }

  return {
    left: `${left.toFixed(2)}%`,
    width: `${width.toFixed(2)}%`,
  }
}

/**
 * Calculate milestone marker position
 *
 * @param milestoneDate - Date of the milestone (ISO string)
 * @param project - Project boundaries
 * @returns Position string (left offset as percentage), or null if outside bounds
 *
 * Edge cases handled:
 * - Milestone before project start: returns "0%"
 * - Milestone after project end: returns "100%"
 * - Same date as project start: returns "0%"
 */
export function calculateMilestonePosition(milestoneDate: string, project: Project): string | null {
  const projectStart = parseISO(project.startDate)
  const projectEnd = parseISO(project.endDate)
  const milestone = parseISO(milestoneDate)

  const projectDuration = differenceInDays(projectEnd, projectStart)

  // Edge case: zero-duration project
  if (projectDuration <= 0) {
    return "0%"
  }

  const milestoneOffset = differenceInDays(milestone, projectStart)
  const position = Math.max(0, Math.min(100, (milestoneOffset / projectDuration) * 100))

  return `${position.toFixed(2)}%`
}

/**
 * Calculate today marker position
 *
 * @param project - Project boundaries
 * @returns Position string (left offset as percentage), or null if today is outside project duration
 *
 * Edge cases handled:
 * - Today before project start: returns null
 * - Today after project end: returns null
 * - Today on project start: returns "0%"
 * - Today on project end: returns "100%"
 */
export function calculateTodayPosition(project: Project): string | null {
  const projectStart = parseISO(project.startDate)
  const projectEnd = parseISO(project.endDate)
  const today = new Date()

  // Check if today is within project duration
  if (isBefore(today, projectStart) || isAfter(today, projectEnd)) {
    return null
  }

  const projectDuration = differenceInDays(projectEnd, projectStart)

  // Edge case: zero-duration project
  if (projectDuration <= 0) {
    return "0%"
  }

  const todayOffset = differenceInDays(today, projectStart)
  const position = Math.max(0, Math.min(100, (todayOffset / projectDuration) * 100))

  return `${position.toFixed(2)}%`
}

/**
 * Calculate overall project progress from phases
 *
 * @param phases - Array of phases
 * @returns Overall progress percentage (0-100)
 *
 * Calculation: Average of all phase progress percentages
 */
export function calculateProjectProgress(phases: Phase[]): number {
  if (phases.length === 0) {
    return 0
  }

  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0)
  return Math.round(totalProgress / phases.length)
}

/**
 * Calculate project duration in days
 *
 * @param project - Project boundaries
 * @returns Number of days
 */
export function calculateProjectDuration(project: Project): number {
  const start = parseISO(project.startDate)
  const end = parseISO(project.endDate)
  return Math.max(0, differenceInDays(end, start))
}

/**
 * Get milestones for a specific phase
 *
 * @param phaseId - Phase ID
 * @param milestones - All milestones
 * @returns Filtered array of milestones for the phase
 */
export function getMilestonesForPhase(phaseId: string, milestones: Milestone[]): Milestone[] {
  return milestones.filter((m) => m.phaseId === phaseId)
}

/**
 * Determine if a phase should show a right edge indicator (for in-progress status)
 *
 * @param phase - Phase to check
 * @returns True if phase is in-progress
 */
export function shouldShowRightEdge(phase: Phase): boolean {
  return phase.status === "in-progress"
}
