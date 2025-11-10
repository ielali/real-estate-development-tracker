/**
 * Sidebar Component Tests
 * Story 10.3: Collapsible Sidebar Navigation
 */

import React from "react"
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { Sidebar } from "../Sidebar"

// Mock dependencies
const mockUsePathname = vi.fn(() => "/")
const mockUseAuth = vi.fn(() => ({ user: { id: "test-user", email: "test@example.com" } }))

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock Framer Motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, ...props }: React.ComponentPropsWithoutRef<"aside">) => (
      <aside {...props}>{children}</aside>
    ),
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<"div">) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.ComponentPropsWithoutRef<"span">) => (
      <span {...props}>{children}</span>
    ),
  },
}))

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.clear()
    mockUsePathname.mockReturnValue("/")
    mockUseAuth.mockReturnValue({ user: { id: "test-user", email: "test@example.com" } })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  test("renders sidebar with all navigation items for authenticated user", () => {
    render(<Sidebar />)

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Projects")).toBeInTheDocument()
    expect(screen.getByText("Portfolio")).toBeInTheDocument()
    expect(screen.getByText("Contacts")).toBeInTheDocument()
    expect(screen.getByText("Vendors")).toBeInTheDocument()
    expect(screen.getByText("Categories")).toBeInTheDocument()
  })

  test("renders brand logo/title", () => {
    render(<Sidebar />)

    expect(screen.getByText("Real Estate Tracker")).toBeInTheDocument()
  })

  test("renders collapse button", () => {
    render(<Sidebar />)

    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    expect(collapseButton).toBeInTheDocument()
  })

  test("toggle button has correct aria-expanded attribute", () => {
    render(<Sidebar />)

    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    expect(collapseButton).toHaveAttribute("aria-expanded", "true")
  })

  test("sidebar has role and aria-label for accessibility", () => {
    render(<Sidebar />)

    const sidebar = screen.getByRole("complementary")
    expect(sidebar).toHaveAttribute("aria-label", "Main navigation sidebar")
  })

  test("sidebar has data-collapsed attribute", () => {
    render(<Sidebar />)

    const sidebar = screen.getByRole("complementary")
    expect(sidebar).toHaveAttribute("data-collapsed")
  })

  test("toggle button click changes data-collapsed", () => {
    render(<Sidebar />)

    const sidebar = screen.getByRole("complementary")
    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })

    expect(sidebar).toHaveAttribute("data-collapsed", "false")

    fireEvent.click(collapseButton)

    waitFor(() => {
      expect(sidebar).toHaveAttribute("data-collapsed", "true")
    })
  })

  test("persists collapsed state to localStorage", () => {
    render(<Sidebar />)

    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    fireEvent.click(collapseButton)

    waitFor(() => {
      expect(localStorage.getItem("sidebar-collapsed")).toBe("true")
    })
  })

  test("restores collapsed state from localStorage on mount", () => {
    localStorage.setItem("sidebar-collapsed", "true")

    render(<Sidebar />)

    const sidebar = screen.getByRole("complementary")
    expect(sidebar).toHaveAttribute("data-collapsed", "true")
  })

  test("sidebar is fixed positioned and full height", () => {
    render(<Sidebar />)

    const sidebar = screen.getByRole("complementary")
    expect(sidebar).toHaveClass("fixed")
    expect(sidebar).toHaveClass("h-screen")
  })

  test("all navigation links are rendered", () => {
    render(<Sidebar />)

    const homeLink = screen.getByRole("link", { name: /home/i })
    const projectsLink = screen.getByRole("link", { name: /projects/i })

    expect(homeLink).toHaveAttribute("href", "/")
    expect(projectsLink).toHaveAttribute("href", "/projects")
  })

  test("collapse button text is visible when expanded", () => {
    render(<Sidebar />)

    expect(screen.getByText("Collapse")).toBeInTheDocument()
  })
})
