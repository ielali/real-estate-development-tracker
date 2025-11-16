/**
 * Timeline Controls Component Tests
 *
 * Tests for TimelineControls component including:
 * - Project duration rendering
 * - Progress bar rendering and accessibility
 * - Today indicator
 */

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TimelineControls } from "../TimelineControls"
import type { Project } from "@/lib/timeline-calculations"

describe("TimelineControls", () => {
  const mockProject: Project = {
    id: "proj-1",
    name: "Test Project",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  }

  it("renders project duration", () => {
    render(<TimelineControls project={mockProject} progress={50} />)

    expect(screen.getByText("Project Duration")).toBeInTheDocument()
    expect(screen.getByText(/Jan 1, 2025 - Dec 31, 2025/)).toBeInTheDocument()
  })

  it("renders progress bar with correct percentage", () => {
    render(<TimelineControls project={mockProject} progress={75} />)

    const progressBar = screen.getByRole("progressbar")

    expect(progressBar).toHaveAttribute("aria-valuenow", "75")
    expect(progressBar).toHaveAttribute("aria-valuemin", "0")
    expect(progressBar).toHaveAttribute("aria-valuemax", "100")
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("renders today indicator", () => {
    render(<TimelineControls project={mockProject} progress={50} />)

    expect(screen.getByText("Today")).toBeInTheDocument()
  })

  it("renders with 0% progress", () => {
    render(<TimelineControls project={mockProject} progress={0} />)

    expect(screen.getByText("0%")).toBeInTheDocument()
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toHaveAttribute("aria-valuenow", "0")
  })

  it("renders with 100% progress", () => {
    render(<TimelineControls project={mockProject} progress={100} />)

    expect(screen.getByText("100%")).toBeInTheDocument()
    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toHaveAttribute("aria-valuenow", "100")
  })
})
