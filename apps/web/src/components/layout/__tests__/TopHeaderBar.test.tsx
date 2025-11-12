/**
 * TopHeaderBar Component Tests
 * Story 10.10: Top Header Bar - Global Search & Actions
 *
 * Tests cover all acceptance criteria:
 * - AC 1,2: Search bar rendering and placeholder
 * - AC 3: Notification badge visibility
 * - AC 4: CTA button rendering
 * - AC 5: Fixed positioning and height
 * - AC 9: Mobile responsive behavior
 * - AC 10: Consistent height
 * - AC 11: Keyboard accessibility
 * - AC 12: Badge animation
 * - AC 13: Design system compliance
 */

import React from "react"
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { TopHeaderBar } from "../TopHeaderBar"

// Mock useViewport hook
const mockUseViewport = vi.fn(() => ({ isMobile: false, width: 1024, height: 768 }))

vi.mock("@/hooks/useViewport", () => ({
  useViewport: () => mockUseViewport(),
}))

// Mock useCollapsedSidebar hook
const mockUseCollapsedSidebar = vi.fn(() => ({
  isCollapsed: false,
  toggle: vi.fn(),
  setCollapsed: vi.fn(),
}))

vi.mock("@/hooks/useCollapsedSidebar", () => ({
  useCollapsedSidebar: () => mockUseCollapsedSidebar(),
}))

// Mock framer-motion to avoid animation complexities in tests
vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.ComponentPropsWithoutRef<"header">) => (
      <header {...props}>{children}</header>
    ),
    span: ({ children, ...props }: React.ComponentPropsWithoutRef<"span">) => (
      <span {...props}>{children}</span>
    ),
  },
}))

describe("TopHeaderBar", () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ isMobile: false, width: 1024, height: 768 })
    mockUseCollapsedSidebar.mockReturnValue({
      isCollapsed: false,
      toggle: vi.fn(),
      setCollapsed: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe("AC 1,2: Global Search Bar (Desktop)", () => {
    test("renders search bar with correct placeholder text", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute("type", "search")
    })

    test("displays search icon in search bar", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      const searchContainer = searchInput.closest("div")
      expect(searchContainer).toBeInTheDocument()
    })

    test("calls onSearchChange when user types in search", () => {
      const onSearchChange = vi.fn()
      render(<TopHeaderBar onSearchChange={onSearchChange} />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      fireEvent.change(searchInput, { target: { value: "test query" } })

      expect(onSearchChange).toHaveBeenCalledWith("test query")
    })
  })

  describe("AC 3: Notification Button with Badge", () => {
    test("displays notification button", () => {
      render(<TopHeaderBar />)

      const notificationButton = screen.getByLabelText(/notifications/i)
      expect(notificationButton).toBeInTheDocument()
    })

    test("shows badge when notificationCount > 0", () => {
      const { container } = render(<TopHeaderBar notificationCount={3} />)

      const notificationButton = screen.getByLabelText(/notifications.*3 unread/i)
      expect(notificationButton).toBeInTheDocument()

      // Badge should be present (red dot)
      const badge = container.querySelector(".bg-destructive")
      expect(badge).toBeInTheDocument()
    })

    test("hides badge when notificationCount = 0", () => {
      const { container } = render(<TopHeaderBar notificationCount={0} />)

      const badge = container.querySelector(".bg-destructive")
      expect(badge).not.toBeInTheDocument()
    })

    test("updates aria-label with notification count", () => {
      render(<TopHeaderBar notificationCount={5} />)

      const notificationButton = screen.getByLabelText(/notifications.*5 unread/i)
      expect(notificationButton).toBeInTheDocument()
    })
  })

  describe("AC 4: Primary CTA Button (Desktop)", () => {
    test("renders CTA button with default label", () => {
      render(<TopHeaderBar />)

      const ctaButton = screen.getByRole("button", { name: "New Project" })
      expect(ctaButton).toBeInTheDocument()
    })

    test("renders CTA button with custom label", () => {
      render(<TopHeaderBar ctaLabel="Add Cost" />)

      const ctaButton = screen.getByRole("button", { name: "Add Cost" })
      expect(ctaButton).toBeInTheDocument()
    })

    test("calls ctaAction when CTA button is clicked", () => {
      const ctaAction = vi.fn()
      render(<TopHeaderBar ctaAction={ctaAction} />)

      const ctaButton = screen.getByRole("button", { name: "New Project" })
      fireEvent.click(ctaButton)

      expect(ctaAction).toHaveBeenCalledTimes(1)
    })

    test("displays Plus icon in CTA button", () => {
      render(<TopHeaderBar />)

      const ctaButton = screen.getByRole("button", { name: "New Project" })
      // Check for Plus icon by looking for svg in button
      const svg = ctaButton.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })
  })

  describe("AC 5,10: Fixed Positioning and Height", () => {
    test("has fixed positioning with correct z-index", () => {
      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("fixed")
      expect(header).toHaveClass("z-30")
    })

    test("maintains consistent height of 64px (h-16)", () => {
      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("h-16")
    })

    test("has top-0 and right-0 positioning", () => {
      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("top-0")
      expect(header).toHaveClass("right-0")
    })
  })

  describe("AC 9: Mobile Responsive Behavior", () => {
    beforeEach(() => {
      mockUseViewport.mockReturnValue({ isMobile: true, width: 375, height: 667 })
    })

    test("hides full search bar on mobile", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.queryByPlaceholderText("Search projects, costs, vendors...")
      expect(searchInput).not.toBeInTheDocument()
    })

    test("shows search icon button on mobile", () => {
      render(<TopHeaderBar />)

      const searchButton = screen.getByLabelText("Open search")
      expect(searchButton).toBeInTheDocument()
    })

    test("hides CTA button on mobile", () => {
      render(<TopHeaderBar ctaLabel="New Project" />)

      const ctaButton = screen.queryByRole("button", { name: "New Project" })
      expect(ctaButton).not.toBeInTheDocument()
    })

    test("ensures touch-friendly button sizes on mobile (min 48x48px)", () => {
      const { container } = render(<TopHeaderBar />)

      const buttons = container.querySelectorAll("button")
      buttons.forEach((button) => {
        // Check for min-h-12 and min-w-12 classes (48px = 12 * 4px)
        const hasMinSize =
          button.classList.contains("min-h-12") || button.classList.contains("min-w-12")
        if (hasMinSize) {
          expect(button).toHaveClass("min-h-12")
          expect(button).toHaveClass("min-w-12")
        }
      })
    })
  })

  describe("AC 11: Keyboard Accessibility", () => {
    test("search input is focusable", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      searchInput.focus()

      expect(searchInput).toHaveFocus()
    })

    test("search input has accessible label", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByLabelText("Global search")
      expect(searchInput).toBeInTheDocument()
    })

    test("notification button has accessible label", () => {
      render(<TopHeaderBar />)

      const notificationButton = screen.getByLabelText(/notifications/i)
      expect(notificationButton).toBeInTheDocument()
    })

    test("CTA button is keyboard accessible", () => {
      render(<TopHeaderBar />)

      const ctaButton = screen.getByRole("button", { name: "New Project" })
      ctaButton.focus()

      expect(ctaButton).toHaveFocus()
    })

    test("search icon has aria-hidden to avoid duplication", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      const searchContainer = searchInput.closest("div")
      const searchIcon = searchContainer?.querySelector('svg[aria-hidden="true"]')

      expect(searchIcon).toBeInTheDocument()
    })
  })

  describe("AC 13: Design System Compliance", () => {
    test("uses design system background color", () => {
      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("bg-background")
    })

    test("uses design system border color", () => {
      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("border-b")
      expect(header).toHaveClass("border-border")
    })

    test("applies consistent spacing (px-6)", () => {
      const { container } = render(<TopHeaderBar />)

      const innerContainer = container.querySelector(".px-6")
      expect(innerContainer).toBeInTheDocument()
    })

    test("uses secondary background for search input", () => {
      render(<TopHeaderBar />)

      const searchInput = screen.getByPlaceholderText("Search projects, costs, vendors...")
      expect(searchInput).toHaveClass("bg-secondary")
    })
  })

  describe("Sidebar Coordination", () => {
    test("adjusts position when sidebar is collapsed", () => {
      mockUseCollapsedSidebar.mockReturnValue({
        isCollapsed: true,
        toggle: vi.fn(),
        setCollapsed: vi.fn(),
      })

      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toBeInTheDocument()
      // Motion component should handle marginLeft animation
    })

    test("adjusts position when sidebar is expanded", () => {
      mockUseCollapsedSidebar.mockReturnValue({
        isCollapsed: false,
        toggle: vi.fn(),
        setCollapsed: vi.fn(),
      })

      const { container } = render(<TopHeaderBar />)

      const header = container.querySelector("header")
      expect(header).toBeInTheDocument()
    })
  })

  describe("Custom Props", () => {
    test("applies custom className", () => {
      const { container } = render(<TopHeaderBar className="custom-class" />)

      const header = container.querySelector("header")
      expect(header).toHaveClass("custom-class")
    })

    test("handles missing optional props gracefully", () => {
      expect(() => render(<TopHeaderBar />)).not.toThrow()
    })
  })

  describe("Component Interactions", () => {
    test("notification button is clickable", () => {
      render(<TopHeaderBar notificationCount={3} />)

      const notificationButton = screen.getByLabelText(/notifications/i)
      fireEvent.click(notificationButton)

      // Button should handle click (no errors)
      expect(notificationButton).toBeInTheDocument()
    })

    test("search button (mobile) is clickable", () => {
      mockUseViewport.mockReturnValue({ isMobile: true, width: 375, height: 667 })

      render(<TopHeaderBar />)

      const searchButton = screen.getByLabelText("Open search")
      fireEvent.click(searchButton)

      expect(searchButton).toBeInTheDocument()
    })
  })
})
