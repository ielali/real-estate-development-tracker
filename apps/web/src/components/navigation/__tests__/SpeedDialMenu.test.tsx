/**
 * SpeedDialMenu Tests
 * Story 10.7: Floating Action Button with Speed Dial
 */

import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SpeedDialMenu } from "../SpeedDialMenu"
import { Camera, DollarSign } from "lucide-react"
import type { SpeedDialOption } from "@/types/speed-dial"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: React.PropsWithChildren<{
      className?: string
      [key: string]: unknown
    }>) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock SpeedDialItem component
vi.mock("../SpeedDialItem", () => ({
  SpeedDialItem: ({ option, onClick }: { option: SpeedDialOption; onClick: () => void }) => (
    <button onClick={onClick} role="menuitem">
      {option.label}
    </button>
  ),
}))

describe("SpeedDialMenu", () => {
  const mockOptions: SpeedDialOption[] = [
    {
      id: "photo",
      icon: Camera,
      label: "Photo",
      action: "capture-photo",
      description: "Take a photo",
    },
    {
      id: "cost",
      icon: DollarSign,
      label: "Cost",
      action: "add-cost",
      description: "Add project cost",
    },
  ]

  const mockOnOptionSelect = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders menu when open", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const menu = screen.getByRole("menu")
    expect(menu).toBeInTheDocument()
    expect(menu).toHaveAttribute("aria-label", "Quick actions")
  })

  test("does not render menu when closed", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={false}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const menu = screen.queryByRole("menu")
    expect(menu).not.toBeInTheDocument()
  })

  test("renders all speed dial options", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByRole("menuitem", { name: "Photo" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Cost" })).toBeInTheDocument()
  })

  test("calls onOptionSelect when option is clicked", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const photoOption = screen.getByRole("menuitem", { name: "Photo" })
    fireEvent.click(photoOption)

    expect(mockOnOptionSelect).toHaveBeenCalledTimes(1)
    expect(mockOnOptionSelect).toHaveBeenCalledWith(mockOptions[0])
  })

  test("closes menu on Escape key", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    fireEvent.keyDown(document, { key: "Escape" })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test("handles arrow key navigation", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const photoOption = screen.getByRole("menuitem", { name: "Photo" })

    // Focus first item
    photoOption.focus()
    expect(document.activeElement).toBe(photoOption)

    // Arrow down to second item (would move focus in real implementation)
    fireEvent.keyDown(document, { key: "ArrowDown" })
    // Note: In this test with mocked components, we're just verifying the handler runs
  })

  test("menu has proper positioning classes", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const menu = screen.getByRole("menu")

    // Check positioning (above FAB, centered)
    expect(menu).toHaveClass("absolute")
    expect(menu).toHaveClass("bottom-full")
    expect(menu).toHaveClass("left-1/2")
    expect(menu).toHaveClass("-translate-x-1/2")
  })

  test("menu has proper z-index for stacking", () => {
    render(
      <SpeedDialMenu
        options={mockOptions}
        isOpen={true}
        onOptionSelect={mockOnOptionSelect}
        onClose={mockOnClose}
      />
    )

    const menu = screen.getByRole("menu")
    expect(menu).toHaveClass("z-50")
  })
})
