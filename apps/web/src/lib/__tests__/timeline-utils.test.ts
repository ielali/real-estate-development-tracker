/**
 * Timeline Utilities Tests
 *
 * Unit tests for timeline utility functions including:
 * - Header generation (monthly/weekly/quarterly)
 * - Filtering (phases and milestones)
 * - Date formatting
 * - Duration calculations
 */

import { describe, it, expect } from "vitest"
import {
  generateMonthHeaders,
  generateHeaders,
  filterPhases,
  filterMilestones,
  formatDate,
  formatDateRange,
  formatDuration,
  getDefaultFilters,
  hasActiveFilters,
  type TimelineFilters,
} from "../timeline-utils"
import type { Project, Phase, Milestone } from "../timeline-calculations"

describe("generateMonthHeaders", () => {
  it("generates month headers for year-long project", () => {
    const project: Project = {
      id: "proj-1",
      name: "Test Project",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    }

    const headers = generateMonthHeaders(project)

    expect(headers).toHaveLength(12)
    expect(headers[0].label).toBe("Jan 2025")
    expect(headers[11].label).toBe("Dec 2025")
  })

  it("generates headers for short project (1 month)", () => {
    const project: Project = {
      id: "proj-1",
      name: "Test Project",
      startDate: "2025-06-01",
      endDate: "2025-06-30",
    }

    const headers = generateMonthHeaders(project)

    expect(headers).toHaveLength(1)
    expect(headers[0].label).toBe("Jun 2025")
  })

  it("generates headers spanning multiple years", () => {
    const project: Project = {
      id: "proj-1",
      name: "Test Project",
      startDate: "2024-11-01",
      endDate: "2025-02-28",
    }

    const headers = generateMonthHeaders(project)

    expect(headers).toHaveLength(4) // Nov, Dec, Jan, Feb
    expect(headers[0].label).toBe("Nov 2024")
    expect(headers[3].label).toBe("Feb 2025")
  })
})

describe("generateHeaders", () => {
  const project: Project = {
    id: "proj-1",
    name: "Test Project",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  }

  it("generates monthly headers by default", () => {
    const headers = generateHeaders(project, "monthly")

    expect(headers).toHaveLength(12)
  })

  it("generates weekly headers", () => {
    const headers = generateHeaders(project, "weekly")

    // Year has ~52 weeks
    expect(headers.length).toBeGreaterThan(50)
    expect(headers.length).toBeLessThan(54)
  })

  it("generates quarterly headers", () => {
    const headers = generateHeaders(project, "quarterly")

    expect(headers).toHaveLength(4) // Q1, Q2, Q3, Q4
  })
})

describe("filterPhases", () => {
  const phases: Phase[] = [
    {
      id: "1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      progress: 100,
      status: "complete",
    },
    {
      id: "2",
      name: "Phase 2",
      phaseNumber: 2,
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      progress: 75,
      status: "in-progress",
    },
    {
      id: "3",
      name: "Phase 3",
      phaseNumber: 3,
      startDate: "2025-07-01",
      endDate: "2025-09-30",
      progress: 0,
      status: "upcoming",
    },
    {
      id: "4",
      name: "Phase 4",
      phaseNumber: 4,
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      progress: 0,
      status: "planned",
    },
  ]

  it("shows all phases when all filters enabled", () => {
    const filters: TimelineFilters = {
      showComplete: true,
      showInProgress: true,
      showUpcoming: true,
      showPlanned: true,
    }

    const result = filterPhases(phases, filters)

    expect(result).toHaveLength(4)
  })

  it("filters out complete phases", () => {
    const filters: TimelineFilters = {
      showComplete: false,
      showInProgress: true,
      showUpcoming: true,
      showPlanned: true,
    }

    const result = filterPhases(phases, filters)

    expect(result).toHaveLength(3)
    expect(result.find((p) => p.status === "complete")).toBeUndefined()
  })

  it("shows only in-progress phases", () => {
    const filters: TimelineFilters = {
      showComplete: false,
      showInProgress: true,
      showUpcoming: false,
      showPlanned: false,
    }

    const result = filterPhases(phases, filters)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe("in-progress")
  })

  it("returns empty array when all filters disabled", () => {
    const filters: TimelineFilters = {
      showComplete: false,
      showInProgress: false,
      showUpcoming: false,
      showPlanned: false,
    }

    const result = filterPhases(phases, filters)

    expect(result).toHaveLength(0)
  })
})

describe("filterMilestones", () => {
  const phases: Phase[] = [
    {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-2",
      name: "Phase 2",
      phaseNumber: 2,
      startDate: "2025-07-01",
      endDate: "2025-12-31",
      progress: 50,
      status: "in-progress",
    },
  ]

  const milestones: Milestone[] = [
    {
      id: "m1",
      name: "Milestone 1",
      date: "2025-03-01",
      phaseId: "phase-1",
      status: "complete",
      icon: "checkmark",
    },
    {
      id: "m2",
      name: "Milestone 2",
      date: "2025-09-01",
      phaseId: "phase-2",
      status: "upcoming",
      icon: "clock",
    },
    {
      id: "m3",
      name: "Milestone 3",
      date: "2025-11-01",
      phaseId: "phase-2",
      status: "planned",
      icon: "clipboard",
    },
  ]

  it("shows milestones for all visible phases", () => {
    const result = filterMilestones(milestones, phases)

    expect(result).toHaveLength(3)
  })

  it("filters milestones when phase is hidden", () => {
    const visiblePhases = [phases[0]] // Only phase-1

    const result = filterMilestones(milestones, visiblePhases)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("m1")
  })

  it("returns empty array when no phases visible", () => {
    const result = filterMilestones(milestones, [])

    expect(result).toHaveLength(0)
  })
})

describe("formatDate", () => {
  it("formats date with default format", () => {
    const result = formatDate("2025-06-15")

    expect(result).toBe("Jun 15, 2025")
  })

  it("formats date with custom format", () => {
    const result = formatDate("2025-06-15", "yyyy-MM-dd")

    expect(result).toBe("2025-06-15")
  })

  it("formats date with short format", () => {
    const result = formatDate("2025-06-15", "MMM d")

    expect(result).toBe("Jun 15")
  })
})

describe("formatDateRange", () => {
  it("formats date range", () => {
    const result = formatDateRange("2025-01-01", "2025-12-31")

    expect(result).toBe("Jan 1, 2025 - Dec 31, 2025")
  })

  it("formats same-year date range", () => {
    const result = formatDateRange("2025-06-01", "2025-06-30")

    expect(result).toBe("Jun 1, 2025 - Jun 30, 2025")
  })
})

describe("formatDuration", () => {
  it("formats duration in months", () => {
    const result = formatDuration("2025-01-01", "2025-07-01")

    expect(result).toBe("6 months")
  })

  it("formats duration in weeks", () => {
    const result = formatDuration("2025-06-01", "2025-06-22")

    expect(result).toBe("3 weeks")
  })

  it("formats duration in days", () => {
    const result = formatDuration("2025-06-01", "2025-06-05")

    expect(result).toBe("4 days")
  })

  it("uses singular for single unit", () => {
    const monthResult = formatDuration("2025-06-01", "2025-07-01")
    expect(monthResult).toBe("1 month")

    const weekResult = formatDuration("2025-06-01", "2025-06-08")
    expect(weekResult).toBe("1 week")

    const dayResult = formatDuration("2025-06-01", "2025-06-02")
    expect(dayResult).toBe("1 day")
  })
})

describe("getDefaultFilters", () => {
  it("returns all filters enabled by default", () => {
    const filters = getDefaultFilters()

    expect(filters.showComplete).toBe(true)
    expect(filters.showInProgress).toBe(true)
    expect(filters.showUpcoming).toBe(true)
    expect(filters.showPlanned).toBe(true)
  })
})

describe("hasActiveFilters", () => {
  it("returns false when all filters enabled", () => {
    const filters: TimelineFilters = {
      showComplete: true,
      showInProgress: true,
      showUpcoming: true,
      showPlanned: true,
    }

    expect(hasActiveFilters(filters)).toBe(false)
  })

  it("returns true when any filter disabled", () => {
    const filters: TimelineFilters = {
      showComplete: false,
      showInProgress: true,
      showUpcoming: true,
      showPlanned: true,
    }

    expect(hasActiveFilters(filters)).toBe(true)
  })

  it("returns true when all filters disabled", () => {
    const filters: TimelineFilters = {
      showComplete: false,
      showInProgress: false,
      showUpcoming: false,
      showPlanned: false,
    }

    expect(hasActiveFilters(filters)).toBe(true)
  })
})
