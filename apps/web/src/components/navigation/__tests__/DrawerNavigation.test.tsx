/**
 * DrawerNavigation Component Tests
 * Story 10.6: Swipeable Navigation Drawer
 */

import React from "react"
import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DrawerNavigation } from "../DrawerNavigation"

// Mock dependencies
const mockUseAuth = vi.fn()
const mockUsePathname = vi.fn(() => "/")
const mockLogout = vi.fn()

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    className,
    ...props
  }: React.PropsWithChildren<{
    href: string
    onClick?: () => void
    className?: string
    [key: string]: unknown
  }>) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  ),
}))

describe("DrawerNavigation", () => {
  const mockOnNavigate = vi.fn()

  beforeEach(() => {
    mockOnNavigate.mockClear()
    mockUsePathname.mockReturnValue("/")
    mockLogout.mockClear()
  })

  // AC #5: All desktop navigation items in drawer
  describe("Navigation items rendering", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
        logout: mockLogout,
      })
    })

    test("renders Main section with all items for authenticated user", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Main")).toBeInTheDocument()
      expect(screen.getByText("Home")).toBeInTheDocument()
      expect(screen.getByText("Projects")).toBeInTheDocument()
      expect(screen.getByText("Portfolio")).toBeInTheDocument()
      expect(screen.getByText("Contacts")).toBeInTheDocument()
      expect(screen.getByText("Vendors")).toBeInTheDocument()
      expect(screen.getByText("Categories")).toBeInTheDocument()
    })

    test("renders Account section for authenticated user", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Account")).toBeInTheDocument()
      expect(screen.getByText("Settings")).toBeInTheDocument()
      expect(screen.getByText("Notifications")).toBeInTheDocument()
    })

    test("renders all navigation items with correct hrefs", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/")
      expect(screen.getByRole("link", { name: /projects/i })).toHaveAttribute("href", "/projects")
      expect(screen.getByRole("link", { name: /portfolio/i })).toHaveAttribute("href", "/portfolio")
      expect(screen.getByRole("link", { name: /contacts/i })).toHaveAttribute("href", "/contacts")
      expect(screen.getByRole("link", { name: /vendors/i })).toHaveAttribute(
        "href",
        "/vendors/dashboard"
      )
      expect(screen.getByRole("link", { name: /categories/i })).toHaveAttribute(
        "href",
        "/categories"
      )
    })
  })

  // AC #6: Permission-based visibility
  describe("Permission-based filtering", () => {
    test("hides auth-required items when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      // Home should still be visible
      expect(screen.getByText("Home")).toBeInTheDocument()

      // Auth-required items should not be visible
      expect(screen.queryByText("Projects")).not.toBeInTheDocument()
      expect(screen.queryByText("Portfolio")).not.toBeInTheDocument()
      expect(screen.queryByText("Contacts")).not.toBeInTheDocument()
      expect(screen.queryByText("Vendors")).not.toBeInTheDocument()
      expect(screen.queryByText("Categories")).not.toBeInTheDocument()
      expect(screen.queryByText("Settings")).not.toBeInTheDocument()
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument()
    })

    test("shows admin-only items for admin users", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "admin@example.com",
          role: "admin",
        },
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument()
    })

    test("hides admin-only items for regular users", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument()
    })
  })

  // Active route highlighting
  describe("Active route highlighting", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })
    })

    test("highlights Home when on home page", () => {
      mockUsePathname.mockReturnValue("/")
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const homeLink = screen.getByRole("link", { name: /home/i })
      expect(homeLink).toHaveClass("bg-primary")
      expect(homeLink).toHaveClass("text-primary-foreground")
      expect(homeLink).toHaveAttribute("aria-current", "page")
    })

    test("highlights Projects when on projects page", () => {
      mockUsePathname.mockReturnValue("/projects")
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const projectsLink = screen.getByRole("link", { name: /projects/i })
      expect(projectsLink).toHaveClass("bg-primary")
      expect(projectsLink).toHaveAttribute("aria-current", "page")
    })

    test("highlights Projects when on project detail page", () => {
      mockUsePathname.mockReturnValue("/projects/123")
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const projectsLink = screen.getByRole("link", { name: /projects/i })
      expect(projectsLink).toHaveClass("bg-primary")
      expect(projectsLink).toHaveAttribute("aria-current", "page")
    })

    test("only one nav item is active at a time", () => {
      mockUsePathname.mockReturnValue("/projects")
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const activeLinks = screen
        .getAllByRole("link")
        .filter((link) => link.getAttribute("aria-current") === "page")
      expect(activeLinks.length).toBe(1)
    })
  })

  // Navigation callback
  describe("Navigation interaction", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })
    })

    test("calls onNavigate when clicking a nav item", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const projectsLink = screen.getByRole("link", { name: /projects/i })
      fireEvent.click(projectsLink)
      expect(mockOnNavigate).toHaveBeenCalled()
    })

    test("calls onNavigate for each nav item click", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const homeLink = screen.getByRole("link", { name: /home/i })
      fireEvent.click(homeLink)
      expect(mockOnNavigate).toHaveBeenCalledTimes(1)

      const portfolioLink = screen.getByRole("link", { name: /portfolio/i })
      fireEvent.click(portfolioLink)
      expect(mockOnNavigate).toHaveBeenCalledTimes(2)
    })
  })

  // Logout functionality
  describe("Logout functionality", () => {
    test("renders logout button for authenticated users", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument()
    })

    test("does not render logout button for unauthenticated users", () => {
      mockUseAuth.mockReturnValue({
        user: null,
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument()
    })

    test("logout button calls logout and onNavigate", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
        logout: mockLogout,
      })

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const logoutButton = screen.getByRole("button", { name: /logout/i })
      await fireEvent.click(logoutButton)

      expect(mockLogout).toHaveBeenCalled()
      expect(mockOnNavigate).toHaveBeenCalled()
    })
  })

  // Navigation icons
  describe("Navigation icons", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })
    })

    test("each nav item displays an icon", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const links = screen.getAllByRole("link")
      links.forEach((link) => {
        const svg = link.querySelector("svg")
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute("aria-hidden", "true")
      })
    })
  })

  // Section structure
  describe("Section organization", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })
    })

    test("renders sections with headings", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Main")).toBeInTheDocument()
      expect(screen.getByText("Account")).toBeInTheDocument()
    })

    test("section headings have correct styling", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const mainHeading = screen.getByText("Main")
      expect(mainHeading).toHaveClass("text-xs")
      expect(mainHeading).toHaveClass("font-semibold")
      expect(mainHeading).toHaveClass("text-muted-foreground")
    })
  })

  // Accessibility
  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
      })
    })

    test("nav element has proper role", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const nav = screen.getByRole("navigation")
      expect(nav).toBeInTheDocument()
    })

    test("icons are hidden from screen readers", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const icons = document.querySelectorAll("svg")
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("aria-hidden", "true")
      })
    })
  })

  // Styling
  describe("Styling and layout", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          role: "user",
        },
        logout: mockLogout,
      })
    })

    test("navigation has padding", () => {
      const { container } = render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const nav = container.querySelector("nav")
      expect(nav).toHaveClass("py-2")
    })

    test("nav items have hover styling when not active", () => {
      mockUsePathname.mockReturnValue("/projects") // Make home not active

      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const homeLink = screen.getByRole("link", { name: /home/i })
      expect(homeLink).toHaveClass("hover:bg-muted")
    })

    test("nav items have transition classes", () => {
      render(<DrawerNavigation onNavigate={mockOnNavigate} />)

      const homeLink = screen.getByRole("link", { name: /home/i })
      expect(homeLink).toHaveClass("transition-colors")
    })
  })
})
