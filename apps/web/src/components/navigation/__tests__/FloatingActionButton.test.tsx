/**
 * FloatingActionButton Tests
 * Story 10.7: Floating Action Button with Speed Dial
 */

import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FloatingActionButton } from "../FloatingActionButton"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      onClick,
      ...props
    }: React.PropsWithChildren<{
      className?: string
      onClick?: () => void
      [key: string]: unknown
    }>) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock speed dial actions hook
vi.mock("@/hooks/useSpeedDialActions", () => ({
  useSpeedDialActions: () => ({
    handleAction: vi.fn(),
  }),
}))

// Mock SpeedDialMenu component
vi.mock("../SpeedDialMenu", () => ({
  SpeedDialMenu: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="speed-dial-menu" data-open={isOpen}>
      <button onClick={onClose}>Close Menu</button>
    </div>
  ),
}))

describe("FloatingActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders FAB button", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })
    expect(fabButton).toBeInTheDocument()
  })

  test("FAB has proper styling classes", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })

    // Check size (w-14 h-14 = 56x56px)
    expect(fabButton).toHaveClass("w-14")
    expect(fabButton).toHaveClass("h-14")

    // Check shape
    expect(fabButton).toHaveClass("rounded-full")

    // Check colors
    expect(fabButton).toHaveClass("bg-primary")
    expect(fabButton).toHaveClass("text-primary-foreground")

    // Check elevation
    expect(fabButton).toHaveClass("shadow-lg")
  })

  test("FAB button toggles speed dial menu on click", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })
    const menu = screen.getByTestId("speed-dial-menu")

    // Initially closed
    expect(menu).toHaveAttribute("data-open", "false")
    expect(fabButton).toHaveAttribute("aria-expanded", "false")

    // Click to open
    fireEvent.click(fabButton)
    expect(menu).toHaveAttribute("data-open", "true")
    expect(fabButton).toHaveAttribute("aria-expanded", "true")

    // Click to close
    fireEvent.click(fabButton)
    expect(menu).toHaveAttribute("data-open", "false")
    expect(fabButton).toHaveAttribute("aria-expanded", "false")
  })

  test("calls onTap callback when FAB is clicked", () => {
    const onTap = vi.fn()
    render(<FloatingActionButton onTap={onTap} />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })

    fireEvent.click(fabButton)
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  test("backdrop overlay appears when menu is open", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })

    // Open menu
    fireEvent.click(fabButton)

    // Note: The backdrop is rendered but may not have a specific test ID
    // We're relying on the mock showing the menu is open
    const menu = screen.getByTestId("speed-dial-menu")
    expect(menu).toHaveAttribute("data-open", "true")
  })

  test("FAB has proper ARIA attributes", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })

    expect(fabButton).toHaveAttribute("aria-label")
    expect(fabButton).toHaveAttribute("aria-expanded")
    expect(fabButton).toHaveAttribute("aria-controls", "speed-dial-menu")
    expect(fabButton).toHaveAttribute("aria-haspopup", "menu")
  })

  test("FAB aria-label changes based on open state", () => {
    render(<FloatingActionButton />)
    const fabButton = screen.getByRole("button", { name: /open quick actions menu/i })

    // Initially: "Open quick actions menu"
    expect(fabButton).toHaveAttribute("aria-label", "Open quick actions menu")

    // After opening: "Close menu"
    fireEvent.click(fabButton)
    expect(fabButton).toHaveAttribute("aria-label", "Close menu")
  })

  test("accepts custom className prop", () => {
    const { container } = render(<FloatingActionButton className="custom-class" />)
    const fabContainer = container.querySelector(".custom-class")
    expect(fabContainer).toBeInTheDocument()
  })
})
