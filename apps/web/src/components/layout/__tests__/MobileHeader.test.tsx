/**
 * MobileHeader Component Tests
 * Story 10.8: Collapsible Header on Scroll
 */

import { describe, test, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { MobileHeader } from "../MobileHeader"

// Mock the hooks and components
vi.mock("@/hooks/useScrollDirection", () => ({
  useScrollDirection: vi.fn(() => "up"),
}))

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({ user: { name: "Test User", email: "test@example.com" } })),
}))

vi.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell">NotificationBell</div>,
}))

describe("MobileHeader", () => {
  test("renders mobile header with menu button", () => {
    render(<MobileHeader />)

    const menuButton = screen.getByLabelText("Open navigation menu")
    expect(menuButton).toBeInTheDocument()
  })

  test("calls onMenuClick when hamburger button is clicked", async () => {
    const user = userEvent.setup()
    const onMenuClick = vi.fn()

    render(<MobileHeader onMenuClick={onMenuClick} />)

    const menuButton = screen.getByLabelText("Open navigation menu")
    await user.click(menuButton)

    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  test("renders search and notification buttons for authenticated users", () => {
    render(<MobileHeader />)

    const searchButton = screen.getByLabelText("Search")
    const notificationBell = screen.getByTestId("notification-bell")

    expect(searchButton).toBeInTheDocument()
    expect(notificationBell).toBeInTheDocument()
  })

  test("applies correct CSS classes for fixed positioning", () => {
    const { container } = render(<MobileHeader />)

    const header = container.querySelector("header")
    expect(header).toHaveClass("fixed")
    expect(header).toHaveClass("top-0")
    expect(header).toHaveClass("z-40")
  })

  test("applies iOS safe area class", () => {
    const { container } = render(<MobileHeader />)

    const header = container.querySelector("header")
    expect(header).toHaveClass("pt-safe")
  })

  test("applies mobile-only class", () => {
    const { container } = render(<MobileHeader />)

    const header = container.querySelector("header")
    expect(header).toHaveClass("md:hidden")
  })

  test("renders optional title when provided", () => {
    render(<MobileHeader title="Test Page" />)

    expect(screen.getByText("Test Page")).toBeInTheDocument()
  })

  test("does not render title when not provided", () => {
    render(<MobileHeader />)

    const titleElement = screen.queryByRole("heading", { level: 1 })
    expect(titleElement).not.toBeInTheDocument()
  })

  test("applies animation classes for smooth transitions", () => {
    const { container } = render(<MobileHeader />)

    const header = container.querySelector("header")
    expect(header).toHaveClass("transition-transform")
    expect(header).toHaveClass("duration-200")
    expect(header).toHaveClass("ease-in-out")
    expect(header).toHaveClass("will-change-transform")
  })
})
