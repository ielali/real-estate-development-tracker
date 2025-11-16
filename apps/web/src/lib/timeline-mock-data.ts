/**
 * Mock Timeline Data
 *
 * Sample data for developing and testing timeline components.
 * Includes various edge cases and realistic scenarios.
 */

import type { Timeline, Phase, Milestone } from "./timeline-calculations"

/**
 * Mock Timeline Data - Standard Project (6 months)
 */
export const mockTimelineStandard: Timeline = {
  project: {
    id: "proj-1",
    name: "Riverside Commercial Development",
    startDate: "2025-01-15",
    endDate: "2025-07-15",
  },
  phases: [
    {
      id: "phase-1",
      name: "Planning & Permits",
      phaseNumber: 1,
      startDate: "2025-01-15",
      endDate: "2025-02-28",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-2",
      name: "Site Preparation",
      phaseNumber: 2,
      startDate: "2025-03-01",
      endDate: "2025-03-31",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-3",
      name: "Foundation & Structure",
      phaseNumber: 3,
      startDate: "2025-04-01",
      endDate: "2025-05-31",
      progress: 75,
      status: "in-progress",
    },
    {
      id: "phase-4",
      name: "MEP Installation",
      phaseNumber: 4,
      startDate: "2025-06-01",
      endDate: "2025-06-30",
      progress: 0,
      status: "upcoming",
    },
    {
      id: "phase-5",
      name: "Finishes & Closeout",
      phaseNumber: 5,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      progress: 0,
      status: "planned",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      name: "Permits Approved",
      date: "2025-02-15",
      phaseId: "phase-1",
      status: "complete",
      icon: "checkmark",
      description: "All construction permits obtained",
    },
    {
      id: "milestone-2",
      name: "Site Cleared",
      date: "2025-03-15",
      phaseId: "phase-2",
      status: "complete",
      icon: "checkmark",
      description: "Site demolition and clearing complete",
    },
    {
      id: "milestone-3",
      name: "Foundation Inspection",
      date: "2025-04-30",
      phaseId: "phase-3",
      status: "complete",
      icon: "checkmark",
      description: "Foundation inspection passed",
    },
    {
      id: "milestone-4",
      name: "Framing Complete",
      date: "2025-05-25",
      phaseId: "phase-3",
      status: "upcoming",
      icon: "clock",
      description: "Structural framing completion target",
    },
    {
      id: "milestone-5",
      name: "MEP Rough-In Inspection",
      date: "2025-06-20",
      phaseId: "phase-4",
      status: "upcoming",
      icon: "clock",
      description: "Mechanical, electrical, plumbing rough-in inspection",
    },
    {
      id: "milestone-6",
      name: "Final Inspection",
      date: "2025-07-10",
      phaseId: "phase-5",
      status: "planned",
      icon: "clipboard",
      description: "Final building inspection",
    },
    {
      id: "milestone-7",
      name: "Certificate of Occupancy",
      date: "2025-07-15",
      phaseId: "phase-5",
      status: "planned",
      icon: "clipboard",
      description: "Certificate of Occupancy issued",
    },
  ],
}

/**
 * Mock Timeline Data - Short Project (1 month)
 * Edge case: Minimal duration
 */
export const mockTimelineShort: Timeline = {
  project: {
    id: "proj-2",
    name: "Small Renovation Project",
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  },
  phases: [
    {
      id: "phase-1",
      name: "Design",
      phaseNumber: 1,
      startDate: "2025-06-01",
      endDate: "2025-06-07",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-2",
      name: "Demolition",
      phaseNumber: 2,
      startDate: "2025-06-08",
      endDate: "2025-06-14",
      progress: 80,
      status: "in-progress",
    },
    {
      id: "phase-3",
      name: "Construction",
      phaseNumber: 3,
      startDate: "2025-06-15",
      endDate: "2025-06-28",
      progress: 0,
      status: "upcoming",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      name: "Design Approval",
      date: "2025-06-07",
      phaseId: "phase-1",
      status: "complete",
      icon: "checkmark",
    },
    {
      id: "milestone-2",
      name: "Final Walkthrough",
      date: "2025-06-30",
      phaseId: "phase-3",
      status: "planned",
      icon: "clipboard",
    },
  ],
}

/**
 * Mock Timeline Data - Long Project (2 years)
 * Edge case: Extended duration
 */
export const mockTimelineLong: Timeline = {
  project: {
    id: "proj-3",
    name: "Large Mixed-Use Development",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
  },
  phases: [
    {
      id: "phase-1",
      name: "Pre-Development",
      phaseNumber: 1,
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-2",
      name: "Site Work",
      phaseNumber: 2,
      startDate: "2025-07-01",
      endDate: "2025-12-31",
      progress: 100,
      status: "complete",
    },
    {
      id: "phase-3",
      name: "Vertical Construction",
      phaseNumber: 3,
      startDate: "2026-01-01",
      endDate: "2026-09-30",
      progress: 45,
      status: "in-progress",
    },
    {
      id: "phase-4",
      name: "Interior Finishes",
      phaseNumber: 4,
      startDate: "2026-10-01",
      endDate: "2026-11-30",
      progress: 0,
      status: "upcoming",
    },
    {
      id: "phase-5",
      name: "Commissioning",
      phaseNumber: 5,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      progress: 0,
      status: "planned",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      name: "Financing Closed",
      date: "2025-03-15",
      phaseId: "phase-1",
      status: "complete",
      icon: "checkmark",
    },
    {
      id: "milestone-2",
      name: "Groundbreaking",
      date: "2025-07-01",
      phaseId: "phase-2",
      status: "complete",
      icon: "checkmark",
    },
    {
      id: "milestone-3",
      name: "Topping Out",
      date: "2026-06-30",
      phaseId: "phase-3",
      status: "upcoming",
      icon: "clock",
    },
    {
      id: "milestone-4",
      name: "Grand Opening",
      date: "2026-12-31",
      phaseId: "phase-5",
      status: "planned",
      icon: "clipboard",
    },
  ],
}

/**
 * Mock Timeline Data - Many Phases (Performance Testing)
 * Edge case: High volume of items
 */
export const mockTimelineMany: Timeline = {
  project: {
    id: "proj-4",
    name: "Multi-Building Complex",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  phases: Array.from({ length: 25 }, (_, i) => ({
    id: `phase-${i + 1}`,
    name: `Building ${Math.floor(i / 5) + 1} - Phase ${(i % 5) + 1}`,
    phaseNumber: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    startDate: `2025-${String(Math.floor((i * 12) / 25) + 1).padStart(2, "0")}-01`,
    endDate: `2025-${String(Math.floor(((i + 1) * 12) / 25) + 1).padStart(2, "0")}-01`,
    progress: i < 10 ? 100 : i < 15 ? 50 : 0,
    status: (i < 10 ? "complete" : i < 15 ? "in-progress" : "upcoming") as Phase["status"],
  })),
  milestones: Array.from({ length: 50 }, (_, i) => ({
    id: `milestone-${i + 1}`,
    name: `Milestone ${i + 1}`,
    date: `2025-${String(Math.floor((i * 12) / 50) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    phaseId: `phase-${Math.floor(i / 2) + 1}`,
    status: (i < 20 ? "complete" : i < 30 ? "upcoming" : "planned") as Milestone["status"],
    icon: (i < 20 ? "checkmark" : i < 30 ? "clock" : "clipboard") as Milestone["icon"],
  })),
}

/**
 * Empty Timeline (No Data)
 * Edge case: Empty state
 */
export const mockTimelineEmpty: Timeline = {
  project: {
    id: "proj-5",
    name: "New Project",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
  phases: [],
  milestones: [],
}

/**
 * Default mock data for development
 */
export const mockTimeline = mockTimelineStandard
