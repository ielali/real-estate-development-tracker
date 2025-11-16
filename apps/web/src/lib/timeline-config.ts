/**
 * Timeline Configuration
 *
 * Centralized configuration for timeline visualization including:
 * - Phase colors and styling
 * - Milestone icons and colors
 * - Status mappings
 *
 * Pattern: Follows category-config.ts from Story 10.17 to avoid code duplication
 */

/**
 * Phase Status Types
 */
export type PhaseStatus = "complete" | "in-progress" | "upcoming" | "planned"

/**
 * Milestone Status Types
 */
export type MilestoneStatus = "complete" | "upcoming" | "planned"

/**
 * Milestone Icon Types
 */
export type MilestoneIcon = "checkmark" | "clock" | "clipboard"

/**
 * Phase Color Configuration
 * Maps phase numbers (1-5) to Tailwind CSS classes
 */
export const PHASE_COLORS = {
  1: {
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    bar: "bg-purple-500 dark:bg-purple-600",
    marker: "bg-purple-600 dark:bg-purple-500",
    bg: "bg-purple-50/30 dark:bg-purple-900/10",
    label: "Phase 1",
    colorName: "purple",
  },
  2: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    bar: "bg-blue-500 dark:bg-blue-600",
    marker: "bg-blue-600 dark:bg-blue-500",
    bg: "bg-blue-50/30 dark:bg-blue-900/10",
    label: "Phase 2",
    colorName: "blue",
  },
  3: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    bar: "bg-green-500 dark:bg-green-600",
    marker: "bg-green-600 dark:bg-green-500",
    bg: "bg-green-50/30 dark:bg-green-900/10",
    label: "Phase 3",
    colorName: "green",
  },
  4: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    bar: "bg-yellow-300 dark:bg-yellow-400",
    marker: "bg-yellow-600 dark:bg-yellow-500",
    bg: "bg-yellow-50/30 dark:bg-yellow-900/10",
    label: "Phase 4",
    colorName: "yellow",
  },
  5: {
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    bar: "bg-indigo-300 dark:bg-indigo-400",
    marker: "bg-indigo-600 dark:bg-indigo-500",
    bg: "bg-indigo-50/30 dark:bg-indigo-900/10",
    label: "Phase 5",
    colorName: "indigo",
  },
} as const

/**
 * Status Label Configuration
 */
export const STATUS_LABELS: Record<
  PhaseStatus,
  { text: string | ((progress: number) => string); class: string }
> = {
  complete: {
    text: "Complete",
    class: "text-gray-500 dark:text-gray-400",
  },
  "in-progress": {
    text: (progress: number) => `In Progress - ${progress}%`,
    class: "text-green-600 dark:text-green-400 font-medium",
  },
  upcoming: {
    text: "Upcoming",
    class: "text-gray-500 dark:text-gray-400",
  },
  planned: {
    text: "Planned",
    class: "text-gray-500 dark:text-gray-400",
  },
}

/**
 * Phase Bar Styling by Status
 */
export const PHASE_BAR_STYLES: Record<PhaseStatus, string> = {
  complete: "opacity-100",
  "in-progress": "opacity-100",
  upcoming: "opacity-50",
  planned: "opacity-50",
}

/**
 * Milestone Icon Configuration
 */
export const MILESTONE_ICONS: Record<
  MilestoneIcon,
  { viewBox: string; path: string; class: string }
> = {
  checkmark: {
    viewBox: "0 0 20 20",
    path: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    class: "text-current",
  },
  clock: {
    viewBox: "0 0 20 20",
    path: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
    class: "text-gray-400 dark:text-gray-500",
  },
  clipboard: {
    viewBox: "0 0 20 20",
    path: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    class: "text-gray-400 dark:text-gray-500",
  },
}

/**
 * Milestone Status to Icon Mapping
 */
export const MILESTONE_STATUS_ICON: Record<MilestoneStatus, MilestoneIcon> = {
  complete: "checkmark",
  upcoming: "clock",
  planned: "clipboard",
}

/**
 * Helper function to get phase color configuration
 */
export function getPhaseColor(phaseNumber: number) {
  const phase = (phaseNumber % 5 || 5) as 1 | 2 | 3 | 4 | 5
  return PHASE_COLORS[phase]
}

/**
 * Helper function to get status label
 */
export function getStatusLabel(status: PhaseStatus, progress?: number): string {
  const config = STATUS_LABELS[status]
  if (!config) {
    // Defensive: return status as-is if config not found
    console.warn(`Unknown phase status: ${status}`)
    return status
  }
  if (typeof config.text === "function" && progress !== undefined) {
    return config.text(progress)
  }
  return config.text as string
}

/**
 * Helper function to get milestone icon
 */
export function getMilestoneIcon(status: MilestoneStatus) {
  const iconType = MILESTONE_STATUS_ICON[status]
  if (!iconType) {
    // Defensive: fallback to clipboard if icon type not found
    console.warn(`Unknown milestone status: ${status}`)
    return MILESTONE_ICONS.clipboard
  }
  return MILESTONE_ICONS[iconType]
}
