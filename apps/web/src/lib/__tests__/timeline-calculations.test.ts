/**
 * Timeline Calculations Tests
 *
 * Unit tests for timeline calculation functions including:
 * - Phase positioning
 * - Milestone positioning
 * - Today marker positioning
 * - Project progress calculation
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from "vitest"
import {
  calculatePhasePosition,
  calculateMilestonePosition,
  calculateTodayPosition,
  calculateProjectProgress,
  calculateProjectDuration,
  getMilestonesForPhase,
  shouldShowRightEdge,
  type Phase,
  type Milestone,
  type Project,
} from "../timeline-calculations"

describe("calculatePhasePosition", () => {
  const project: Project = {
    id: "proj-1",
    name: "Test Project",
    startDate: "2025-01-01",
    endDate: "2025-12-31", // 365 days
  }

  it("calculates position for phase in middle of project", () => {
    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-07-01", // ~182 days from start
      endDate: "2025-07-31", // ~30 days duration
      progress: 50,
      status: "in-progress",
    }

    const result = calculatePhasePosition(phase, project)

    // Should be approximately 50% from left (181/364 = ~49.73%)
    expect(parseFloat(result.left)).toBeCloseTo(49.73, 1)
    // Width should be approximately 8.2% (30/364 = ~8.24%)
    expect(parseFloat(result.width)).toBeCloseTo(8.24, 1)
  })

  it("calculates position for phase at project start", () => {
    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      progress: 100,
      status: "complete",
    }

    const result = calculatePhasePosition(phase, project)

    expect(parseFloat(result.left)).toBe(0)
    expect(parseFloat(result.width)).toBeGreaterThan(0)
  })

  it("calculates position for phase at project end", () => {
    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      progress: 0,
      status: "upcoming",
    }

    const result = calculatePhasePosition(phase, project)

    // Should be near 100% (left + width should approach 100%)
    const left = parseFloat(result.left)
    const width = parseFloat(result.width)
    expect(left + width).toBeCloseTo(100, 0)
  })

  it("handles very short phases (< 1 day)", () => {
    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-06-01",
      endDate: "2025-06-01", // Same day
      progress: 100,
      status: "complete",
    }

    const result = calculatePhasePosition(phase, project)

    // Should have minimum width of 0.5%
    expect(parseFloat(result.width)).toBeGreaterThanOrEqual(0.5)
  })

  it("handles zero-duration project", () => {
    const zeroProject: Project = {
      id: "proj-2",
      name: "Zero Project",
      startDate: "2025-01-01",
      endDate: "2025-01-01",
    }

    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-01-01",
      progress: 50,
      status: "in-progress",
    }

    const result = calculatePhasePosition(phase, zeroProject)

    expect(result.left).toBe("0%")
    expect(result.width).toBe("100%")
  })

  it("clamps width to project boundaries", () => {
    const phase: Phase = {
      id: "phase-1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-11-01",
      endDate: "2026-02-01", // Extends beyond project end
      progress: 50,
      status: "in-progress",
    }

    const result = calculatePhasePosition(phase, project)

    const left = parseFloat(result.left)
    const width = parseFloat(result.width)

    // Combined should not exceed 100%
    expect(left + width).toBeLessThanOrEqual(100)
  })
})

describe("calculateMilestonePosition", () => {
  const project: Project = {
    id: "proj-1",
    name: "Test Project",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  }

  it("calculates position for milestone in middle of project", () => {
    const result = calculateMilestonePosition("2025-07-01", project)

    expect(result).not.toBeNull()
    // Should be approximately 50% (181/364 = ~49.73%)
    expect(parseFloat(result!)).toBeCloseTo(49.73, 1)
  })

  it("returns 0% for milestone at project start", () => {
    const result = calculateMilestonePosition("2025-01-01", project)

    expect(result).toBe("0.00%")
  })

  it("returns 100% for milestone at project end", () => {
    const result = calculateMilestonePosition("2025-12-31", project)

    expect(parseFloat(result!)).toBeCloseTo(100, 0)
  })

  it("clamps milestone before project start to 0%", () => {
    const result = calculateMilestonePosition("2024-12-01", project)

    expect(result).toBe("0.00%")
  })

  it("clamps milestone after project end to 100%", () => {
    const result = calculateMilestonePosition("2026-06-01", project)

    expect(result).toBe("100.00%")
  })
})

describe("calculateTodayPosition", () => {
  it("returns null when today is before project start", () => {
    const futureProject: Project = {
      id: "proj-1",
      name: "Future Project",
      startDate: "2030-01-01",
      endDate: "2030-12-31",
    }

    const result = calculateTodayPosition(futureProject)

    expect(result).toBeNull()
  })

  it("returns null when today is after project end", () => {
    const pastProject: Project = {
      id: "proj-1",
      name: "Past Project",
      startDate: "2020-01-01",
      endDate: "2020-12-31",
    }

    const result = calculateTodayPosition(pastProject)

    expect(result).toBeNull()
  })

  it("returns position when today is within project", () => {
    // Create project that includes today
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 3)
    const end = new Date(today)
    end.setMonth(today.getMonth() + 3)

    const currentProject: Project = {
      id: "proj-1",
      name: "Current Project",
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    }

    const result = calculateTodayPosition(currentProject)

    expect(result).not.toBeNull()
    const position = parseFloat(result!)
    expect(position).toBeGreaterThan(0)
    expect(position).toBeLessThan(100)
  })
})

describe("calculateProjectProgress", () => {
  it("returns 0 for empty phases array", () => {
    const result = calculateProjectProgress([])

    expect(result).toBe(0)
  })

  it("calculates average progress from multiple phases", () => {
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
        progress: 50,
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
    ]

    const result = calculateProjectProgress(phases)

    // Average: (100 + 50 + 0) / 3 = 50
    expect(result).toBe(50)
  })

  it("rounds to nearest integer", () => {
    const phases: Phase[] = [
      {
        id: "1",
        name: "Phase 1",
        phaseNumber: 1,
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        progress: 33,
        status: "in-progress",
      },
      {
        id: "2",
        name: "Phase 2",
        phaseNumber: 2,
        startDate: "2025-07-01",
        endDate: "2025-12-31",
        progress: 33,
        status: "upcoming",
      },
    ]

    const result = calculateProjectProgress(phases)

    // Average: (33 + 33) / 2 = 33
    expect(result).toBe(33)
  })
})

describe("calculateProjectDuration", () => {
  it("calculates duration in days", () => {
    const project: Project = {
      id: "proj-1",
      name: "Test Project",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    }

    const result = calculateProjectDuration(project)

    expect(result).toBe(364) // differenceInDays for 2025 (not leap year)
  })

  it("returns 0 for same-day project", () => {
    const project: Project = {
      id: "proj-1",
      name: "Test Project",
      startDate: "2025-06-15",
      endDate: "2025-06-15",
    }

    const result = calculateProjectDuration(project)

    expect(result).toBe(0)
  })
})

describe("getMilestonesForPhase", () => {
  it("returns milestones for specific phase", () => {
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
        date: "2025-06-01",
        phaseId: "phase-2",
        status: "upcoming",
        icon: "clock",
      },
      {
        id: "m3",
        name: "Milestone 3",
        date: "2025-03-15",
        phaseId: "phase-1",
        status: "complete",
        icon: "checkmark",
      },
    ]

    const result = getMilestonesForPhase("phase-1", milestones)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe("m1")
    expect(result[1].id).toBe("m3")
  })

  it("returns empty array when no milestones match", () => {
    const milestones: Milestone[] = [
      {
        id: "m1",
        name: "Milestone 1",
        date: "2025-03-01",
        phaseId: "phase-1",
        status: "complete",
        icon: "checkmark",
      },
    ]

    const result = getMilestonesForPhase("phase-2", milestones)

    expect(result).toHaveLength(0)
  })
})

describe("shouldShowRightEdge", () => {
  it("returns true for in-progress status", () => {
    const phase: Phase = {
      id: "1",
      name: "Phase 1",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      progress: 75,
      status: "in-progress",
    }

    expect(shouldShowRightEdge(phase)).toBe(true)
  })

  it("returns false for other statuses", () => {
    const statuses: Phase["status"][] = ["complete", "upcoming", "planned"]

    statuses.forEach((status) => {
      const phase: Phase = {
        id: "1",
        name: "Phase 1",
        phaseNumber: 1,
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        progress: 0,
        status,
      }

      expect(shouldShowRightEdge(phase)).toBe(false)
    })
  })
})
