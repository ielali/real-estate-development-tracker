/**
 * HorizontalNav Component Tests
 * Story 10.4: Horizontal Top Navigation for Subsections
 * Story 10.12: Layout Integration - Two-Tier Header System (sticky below TopHeaderBar)
 */

import React from "react"
import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { HorizontalNav } from "../HorizontalNav"

// Mock dependencies
const mockUsePathname = vi.fn(() => "/projects/test-id")

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

describe("HorizontalNav", () => {
  const projectId = "test-project-id"

  beforeEach(() => {
    mockUsePathname.mockReturnValue(`/projects/${projectId}`)
  })

  test("renders all navigation items for non-partner users", () => {
    render(<HorizontalNav projectId={projectId} isPartner={false} />)

    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Costs")).toBeInTheDocument()
    expect(screen.getByText("Timeline")).toBeInTheDocument()
    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.getByText("Partners")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  test("hides admin-only items for partner users", () => {
    render(<HorizontalNav projectId={projectId} isPartner={true} />)

    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Costs")).toBeInTheDocument()
    expect(screen.getByText("Timeline")).toBeInTheDocument()
    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.queryByText("Partners")).not.toBeInTheDocument()
    expect(screen.queryByText("Settings")).not.toBeInTheDocument()
  })

  test("navigation has proper accessibility attributes", () => {
    render(<HorizontalNav projectId={projectId} />)

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveAttribute("aria-label", "Project navigation")
  })

  test("navigation is sticky positioned below TopHeaderBar", () => {
    render(<HorizontalNav projectId={projectId} />)

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveClass("sticky")
    expect(nav).toHaveClass("top-16") // 64px below TopHeaderBar (Story 10.12)
    expect(nav).toHaveClass("z-20") // Below TopHeaderBar z-30, above content (Story 10.12)
  })

  test("active item has correct styling and aria-current", () => {
    mockUsePathname.mockReturnValue(`/projects/${projectId}`)
    render(<HorizontalNav projectId={projectId} />)

    const overviewLink = screen.getByRole("link", { name: /overview/i })
    expect(overviewLink).toHaveClass("border-primary")
    expect(overviewLink).toHaveClass("text-foreground")
    expect(overviewLink).toHaveAttribute("aria-current", "page")
  })

  test("inactive items have correct styling", () => {
    mockUsePathname.mockReturnValue(`/projects/${projectId}`)
    render(<HorizontalNav projectId={projectId} />)

    const costsLink = screen.getByRole("link", { name: /costs/i })
    expect(costsLink).toHaveClass("border-transparent")
    expect(costsLink).toHaveClass("text-muted-foreground")
    expect(costsLink).not.toHaveAttribute("aria-current")
  })

  test("all links have correct href attributes", () => {
    render(<HorizontalNav projectId={projectId} />)

    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}`
    )
    expect(screen.getByRole("link", { name: /costs/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/costs`
    )
    expect(screen.getByRole("link", { name: /timeline/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/events`
    )
    expect(screen.getByRole("link", { name: /documents/i })).toHaveAttribute(
      "href",
      `/projects/${projectId}/documents`
    )
  })

  test("each nav item displays an icon", () => {
    render(<HorizontalNav projectId={projectId} />)

    // Icons should have aria-hidden="true" for accessibility
    const links = screen.getAllByRole("link")
    links.forEach((link) => {
      const svg = link.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute("aria-hidden", "true")
    })
  })

  test("navigation has border at bottom", () => {
    render(<HorizontalNav projectId={projectId} />)

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveClass("border-b")
  })

  test("navigation items have hover states", () => {
    render(<HorizontalNav projectId={projectId} />)

    const overviewLink = screen.getByRole("link", { name: /overview/i })
    expect(overviewLink).toHaveClass("hover:text-foreground")
    expect(overviewLink).toHaveClass("hover:bg-accent/50")
  })

  test("navigation items have 200ms transitions", () => {
    render(<HorizontalNav projectId={projectId} />)

    const overviewLink = screen.getByRole("link", { name: /overview/i })
    expect(overviewLink).toHaveClass("transition-all")
    expect(overviewLink).toHaveClass("duration-200")
  })

  test("active state works for child routes", () => {
    mockUsePathname.mockReturnValue(`/projects/${projectId}/costs/new`)
    render(<HorizontalNav projectId={projectId} />)

    const costsLink = screen.getByRole("link", { name: /costs/i })
    expect(costsLink).toHaveClass("border-primary")
    expect(costsLink).toHaveAttribute("aria-current", "page")
  })

  test("navigation has horizontal scroll for mobile", () => {
    render(<HorizontalNav projectId={projectId} />)

    const nav = screen.getByRole("navigation")
    const container = nav.querySelector("div")
    expect(container).toHaveClass("overflow-x-auto")
  })

  test("navigation items have focus-visible styles", () => {
    render(<HorizontalNav projectId={projectId} />)

    const overviewLink = screen.getByRole("link", { name: /overview/i })
    expect(overviewLink).toHaveClass("focus-visible:outline-none")
    expect(overviewLink).toHaveClass("focus-visible:ring-2")
    expect(overviewLink).toHaveClass("focus-visible:ring-ring")
  })
})
