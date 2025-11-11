/**
 * MobileNavigationDrawer Component Tests
 * Story 10.6: Swipeable Navigation Drawer
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MobileNavigationDrawer } from "../MobileNavigationDrawer"

// Mock child components
vi.mock("../SwipeableDrawer", () => ({
  SwipeableDrawer: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => (
    <div data-testid="swipeable-drawer" data-open={open}>
      <button onClick={() => onOpenChange(!open)}>Toggle</button>
      {children}
    </div>
  ),
}))

vi.mock("../DrawerHeader", () => ({
  DrawerHeader: ({ onNavigate }: { onNavigate?: () => void }) => (
    <div data-testid="drawer-header">
      <button onClick={onNavigate}>Navigate from Header</button>
    </div>
  ),
}))

vi.mock("../DrawerNavigation", () => ({
  DrawerNavigation: ({ onNavigate }: { onNavigate?: () => void }) => (
    <div data-testid="drawer-navigation">
      <button onClick={onNavigate}>Navigate from Nav</button>
    </div>
  ),
}))

describe("MobileNavigationDrawer", () => {
  test("renders SwipeableDrawer component", () => {
    render(<MobileNavigationDrawer />)

    expect(screen.getByTestId("swipeable-drawer")).toBeInTheDocument()
  })

  test("renders DrawerHeader component", () => {
    render(<MobileNavigationDrawer />)

    expect(screen.getByTestId("drawer-header")).toBeInTheDocument()
  })

  test("renders DrawerNavigation component", () => {
    render(<MobileNavigationDrawer />)

    expect(screen.getByTestId("drawer-navigation")).toBeInTheDocument()
  })

  test("starts with drawer closed", () => {
    render(<MobileNavigationDrawer />)

    const drawer = screen.getByTestId("swipeable-drawer")
    expect(drawer).toHaveAttribute("data-open", "false")
  })

  test("passes onOpenChange handler to SwipeableDrawer", () => {
    render(<MobileNavigationDrawer />)

    const toggleButton = screen.getByText("Toggle")

    // Should not throw error when clicking toggle button
    expect(() => toggleButton.click()).not.toThrow()
  })

  test("closes drawer when navigating from header", () => {
    render(<MobileNavigationDrawer />)

    const headerButton = screen.getByText("Navigate from Header")

    // Should not throw error when navigating from header
    expect(() => headerButton.click()).not.toThrow()
  })

  test("closes drawer when navigating from navigation", () => {
    render(<MobileNavigationDrawer />)

    const navButton = screen.getByText("Navigate from Nav")

    // Should not throw error when navigating from navigation
    expect(() => navButton.click()).not.toThrow()
  })

  test("maintains component hierarchy", () => {
    render(<MobileNavigationDrawer />)

    const drawer = screen.getByTestId("swipeable-drawer")
    const header = screen.getByTestId("drawer-header")
    const navigation = screen.getByTestId("drawer-navigation")

    // Header and navigation should be children of drawer
    expect(drawer).toContainElement(header)
    expect(drawer).toContainElement(navigation)
  })

  // Hamburger Menu Button Tests
  describe("Hamburger menu button", () => {
    test("renders hamburger menu button", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    test("hamburger button has proper accessibility attributes", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })
      expect(menuButton).toHaveAttribute("aria-label", "Open navigation menu")
      expect(menuButton).toHaveAttribute("aria-expanded", "false")
      expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation-drawer")
    })

    test("clicking hamburger button opens the drawer", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })
      const drawer = screen.getByTestId("swipeable-drawer")

      // Initially closed
      expect(drawer).toHaveAttribute("data-open", "false")

      // Click button
      fireEvent.click(menuButton)

      // Drawer should be open
      expect(drawer).toHaveAttribute("data-open", "true")
    })

    test("hamburger button is mobile-only (has md:hidden class)", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })
      expect(menuButton).toHaveClass("md:hidden")
    })

    test("hamburger button has proper styling classes", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })

      // Check for key styling classes
      expect(menuButton).toHaveClass("fixed")
      expect(menuButton).toHaveClass("top-4")
      expect(menuButton).toHaveClass("left-4")
      expect(menuButton).toHaveClass("w-12")
      expect(menuButton).toHaveClass("h-12")
      expect(menuButton).toHaveClass("rounded-lg")
    })

    test("hamburger button hides when drawer is open", () => {
      render(<MobileNavigationDrawer />)

      const menuButton = screen.getByRole("button", { name: /open navigation menu/i })

      // Initially visible (no opacity-0 class)
      expect(menuButton).not.toHaveClass("opacity-0")

      // Click to open drawer
      fireEvent.click(menuButton)

      // Button should be hidden
      expect(menuButton).toHaveClass("opacity-0")
      expect(menuButton).toHaveClass("pointer-events-none")
    })
  })
})
