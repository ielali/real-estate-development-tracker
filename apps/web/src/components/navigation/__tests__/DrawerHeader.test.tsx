/**
 * DrawerHeader Component Tests
 * Story 10.6: Swipeable Navigation Drawer
 */

import React from "react"
import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DrawerHeader } from "../DrawerHeader"

// Mock dependencies
const mockUseAuth = vi.fn()

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
  }: React.PropsWithChildren<{
    href: string
    onClick?: () => void
  }>) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe("DrawerHeader", () => {
  const mockOnNavigate = vi.fn()

  beforeEach(() => {
    mockOnNavigate.mockClear()
    mockUseAuth.mockClear()
  })

  // AC #4: User profile section at top (authenticated state)
  describe("Authenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
      })
    })

    test("displays user avatar with initials", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const avatar = screen.getByText("JD")
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveClass("bg-primary")
      expect(avatar).toHaveClass("text-primary-foreground")
    })

    test("displays user name", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    test("displays user email", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("john@example.com")).toBeInTheDocument()
    })

    test("displays profile button", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const profileButton = screen.getByRole("link", { name: /profile/i })
      expect(profileButton).toBeInTheDocument()
      expect(profileButton).toHaveAttribute("href", "/settings/profile")
    })

    test("profile button click calls onNavigate", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const profileButton = screen.getByRole("link", { name: /profile/i })
      fireEvent.click(profileButton)
      expect(mockOnNavigate).toHaveBeenCalled()
    })

    test("generates initials from full name correctly", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("JD")).toBeInTheDocument()
    })

    test("uses first character of email when name is missing", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "test@example.com",
          role: "user",
        },
      })

      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("T")).toBeInTheDocument()
    })

    test("falls back to 'U' when both name and email are missing", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          role: "user",
        },
      })

      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("U")).toBeInTheDocument()
    })

    test("displays 'User' when name is null", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          name: null,
          email: "john@example.com",
          role: "user",
        },
      })

      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("User")).toBeInTheDocument()
    })

    test("has border at bottom", () => {
      const { container } = render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass("border-b")
    })

    test("has background styling", () => {
      const { container } = render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass("bg-muted/10")
    })

    test("has proper padding", () => {
      const { container } = render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const header = container.firstChild as HTMLElement
      expect(header).toHaveClass("p-6")
    })
  })

  // AC #4: Unauthenticated state
  describe("Unauthenticated user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
      })
    })

    test("displays welcome message", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Welcome!")).toBeInTheDocument()
    })

    test("displays sign in prompt", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      expect(screen.getByText("Sign in to access all features")).toBeInTheDocument()
    })

    test("displays sign in button", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const signInButton = screen.getByRole("button", { name: /sign in/i })
      expect(signInButton).toBeInTheDocument()
    })

    test("sign in button links to /login", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const signInLink = screen.getByRole("link")
      expect(signInLink).toHaveAttribute("href", "/login")
    })

    test("sign in button click calls onNavigate", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const signInLink = screen.getByRole("link")
      fireEvent.click(signInLink)
      expect(mockOnNavigate).toHaveBeenCalled()
    })

    test("displays user icon placeholder", () => {
      render(<DrawerHeader onNavigate={mockOnNavigate} />)

      // Check for the presence of the icon container
      const iconContainer = document.querySelector(".bg-muted")
      expect(iconContainer).toBeInTheDocument()
    })

    test("has centered text layout", () => {
      const { container } = render(<DrawerHeader onNavigate={mockOnNavigate} />)

      const textContainer = container.querySelector(".text-center")
      expect(textContainer).toBeInTheDocument()
    })
  })

  // Avatar sizing
  test("avatar has correct dimensions (56px)", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        role: "user",
      },
    })

    const { container } = render(<DrawerHeader onNavigate={mockOnNavigate} />)

    const avatar = container.querySelector(".rounded-full")
    expect(avatar).toHaveClass("w-14")
    expect(avatar).toHaveClass("h-14")
    expect(avatar).toHaveClass("bg-primary")
  })

  // Text truncation for long names/emails
  test("truncates long user name", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "1",
        name: "Very Long Name That Should Be Truncated",
        email: "john@example.com",
        role: "user",
      },
    })

    render(<DrawerHeader onNavigate={mockOnNavigate} />)

    const nameElement = screen.getByText("Very Long Name That Should Be Truncated")
    expect(nameElement).toHaveClass("truncate")
  })

  test("truncates long email address", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "1",
        name: "John Doe",
        email: "verylongemailaddress@example.com",
        role: "user",
      },
    })

    render(<DrawerHeader onNavigate={mockOnNavigate} />)

    const emailElement = screen.getByText("verylongemailaddress@example.com")
    expect(emailElement).toHaveClass("truncate")
  })
})
