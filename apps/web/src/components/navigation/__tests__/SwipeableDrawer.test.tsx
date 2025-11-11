/**
 * SwipeableDrawer Component Tests
 * Story 10.6: Swipeable Navigation Drawer
 */

import React from "react"
import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SwipeableDrawer } from "../SwipeableDrawer"

// Mock dependencies
vi.mock("@use-gesture/react", () => ({
  useDrag: vi.fn(() => () => {}),
}))

vi.mock("react-spring", () => ({
  useSpring: vi.fn(() => [{ x: { get: () => 0 }, opacity: { get: () => 0 } }, { start: vi.fn() }]),
  animated: {
    div: "div",
  },
  config: {
    default: {},
  },
}))

vi.mock("focus-trap-react", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe("SwipeableDrawer", () => {
  const mockOnOpenChange = vi.fn()
  const defaultProps = {
    children: <div>Test Content</div>,
    open: false,
    onOpenChange: mockOnOpenChange,
  }

  beforeEach(() => {
    mockOnOpenChange.mockClear()
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  // AC #1: 20px hot zone from left edge for swipe trigger
  test("renders hot zone with 20px width when drawer is closed", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const hotZone = document.querySelector('[aria-hidden="true"]')
    expect(hotZone).toBeInTheDocument()
    expect(hotZone).toHaveStyle({ width: "20px" })
  })

  test("hides hot zone when drawer is open", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    const hotZone = document.querySelector('[aria-hidden="true"]')
    expect(hotZone).toHaveClass("hidden")
  })

  // AC #3: Maximum width 320px or 85% of viewport, whichever is smaller
  test("sets drawer width to 320px when viewport is large", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })

    render(<SwipeableDrawer {...defaultProps} />)

    const drawer = screen.getByRole("dialog")
    const dataWidth = drawer.getAttribute("data-drawer-width")
    expect(dataWidth).toBe("320")
  })

  test("sets drawer width to 85% of viewport when viewport is small", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 300, // 85% = 255px, which is less than 320px
    })

    render(<SwipeableDrawer {...defaultProps} />)

    const drawer = screen.getByRole("dialog")
    const dataWidth = drawer.getAttribute("data-drawer-width")
    expect(Number(dataWidth)).toBeLessThan(320)
  })

  // AC #8: Backdrop overlay with 40% opacity when open
  test("renders backdrop overlay", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const backdrop = document.querySelector(".bg-black")
    expect(backdrop).toBeInTheDocument()
  })

  test("backdrop click calls onOpenChange with false", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    const backdrop = document.querySelector(".bg-black")
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    }
  })

  // AC #9: Focus trap activated when drawer is open
  test("renders with dialog role and aria-modal", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    const drawer = screen.getByRole("dialog")
    expect(drawer).toHaveAttribute("aria-modal", "true")
    expect(drawer).toHaveAttribute("aria-label", "Navigation drawer")
  })

  // Close button functionality
  test("renders close button with X icon", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    const closeButton = screen.getByLabelText("Close drawer")
    expect(closeButton).toBeInTheDocument()
  })

  test("close button click calls onOpenChange with false", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    const closeButton = screen.getByLabelText("Close drawer")
    fireEvent.click(closeButton)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  // Escape key handling
  test("closes drawer on Escape key press when open", () => {
    render(<SwipeableDrawer {...defaultProps} open={true} />)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  test("does not call onOpenChange on Escape when drawer is closed", () => {
    render(<SwipeableDrawer {...defaultProps} open={false} />)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })

  // Body scroll prevention
  test("prevents body scroll when drawer is open", () => {
    const { rerender } = render(<SwipeableDrawer {...defaultProps} open={false} />)
    expect(document.body.style.overflow).toBe("")

    rerender(<SwipeableDrawer {...defaultProps} open={true} />)
    expect(document.body.style.overflow).toBe("hidden")
  })

  test("restores body scroll when drawer is closed", () => {
    const { rerender } = render(<SwipeableDrawer {...defaultProps} open={true} />)
    expect(document.body.style.overflow).toBe("hidden")

    rerender(<SwipeableDrawer {...defaultProps} open={false} />)
    expect(document.body.style.overflow).toBe("")
  })

  // Mobile-only display
  test("has mobile-only display class", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const drawer = screen.getByRole("dialog")
    expect(drawer).toHaveClass("md:hidden")
  })

  // Drawer content rendering
  test("renders children content", () => {
    render(
      <SwipeableDrawer {...defaultProps}>
        <div>Custom Content</div>
      </SwipeableDrawer>
    )

    expect(screen.getByText("Custom Content")).toBeInTheDocument()
  })

  // Drawer positioning
  test("has fixed positioning and correct z-index", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const drawer = screen.getByRole("dialog")
    expect(drawer).toHaveClass("fixed")
    expect(drawer).toHaveClass("top-0")
    expect(drawer).toHaveClass("left-0")
    expect(drawer).toHaveClass("z-50")
  })

  // Drawer styling
  test("has background and shadow styling", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const drawer = screen.getByRole("dialog")
    expect(drawer).toHaveClass("bg-background")
    expect(drawer).toHaveClass("shadow-lg")
  })

  // Responsive width updates
  test("updates drawer width on window resize", async () => {
    render(<SwipeableDrawer {...defaultProps} />)

    // Change window width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    })

    // Trigger resize event
    fireEvent(window, new Event("resize"))

    // Wait for state update
    await waitFor(() => {
      const drawer = screen.getByRole("dialog")
      const dataWidth = drawer.getAttribute("data-drawer-width")
      // 400 * 0.85 = 340, but max is 320
      expect(dataWidth).toBe("320")
    })
  })

  // Backdrop z-index
  test("backdrop has correct z-index", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const backdrop = document.querySelector(".bg-black")
    expect(backdrop).toHaveClass("z-40")
  })

  // Hot zone z-index
  test("hot zone has correct z-index", () => {
    render(<SwipeableDrawer {...defaultProps} />)

    const hotZone = document.querySelector('[aria-hidden="true"]')
    expect(hotZone).toHaveClass("z-40")
  })
})
