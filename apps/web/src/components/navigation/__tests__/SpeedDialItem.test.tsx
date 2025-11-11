/**
 * SpeedDialItem Tests
 * Story 10.7: Floating Action Button with Speed Dial
 */

import { describe, test, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SpeedDialItem } from "../SpeedDialItem"
import { Camera } from "lucide-react"
import type { SpeedDialOption } from "@/types/speed-dial"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
      ...props
    }: React.PropsWithChildren<{
      className?: string
      onClick?: () => void
      [key: string]: unknown
    }>) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}))

describe("SpeedDialItem", () => {
  const mockOption: SpeedDialOption = {
    id: "photo",
    icon: Camera,
    label: "Photo",
    action: "capture-photo",
    description: "Take a photo",
  }

  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders speed dial item", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")
    expect(item).toBeInTheDocument()
  })

  test("displays option label", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    expect(screen.getByText("Photo")).toBeInTheDocument()
  })

  test("calls onClick when clicked", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")

    fireEvent.click(item)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  test("has proper ARIA label from description", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")
    expect(item).toHaveAttribute("aria-label", "Take a photo")
  })

  test("falls back to label if no description provided", () => {
    const optionWithoutDescription: SpeedDialOption = {
      ...mockOption,
      description: undefined,
    }

    render(<SpeedDialItem option={optionWithoutDescription} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")
    expect(item).toHaveAttribute("aria-label", "Photo")
  })

  test("has proper touch target size (min 48x48px)", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")

    // Check minimum height (48px)
    expect(item).toHaveClass("min-h-[48px]")
  })

  test("has proper styling classes", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")

    // Check shape
    expect(item).toHaveClass("rounded-full")

    // Check elevation
    expect(item).toHaveClass("shadow-md")

    // Check background
    expect(item).toHaveClass("bg-background")
  })

  test("has hover and focus states", () => {
    render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)
    const item = screen.getByRole("menuitem")

    // Check hover classes exist
    expect(item.className).toContain("hover:bg-accent")
    expect(item.className).toContain("hover:scale-105")

    // Check focus-visible ring
    expect(item.className).toContain("focus-visible:ring-2")
    expect(item.className).toContain("focus-visible:ring-primary")
  })

  test("renders icon with proper styling", () => {
    const { container } = render(<SpeedDialItem option={mockOption} onClick={mockOnClick} />)

    // Check icon container exists
    const iconContainer = container.querySelector(".bg-primary\\/10")
    expect(iconContainer).toBeInTheDocument()

    // Check icon is rounded
    expect(iconContainer).toHaveClass("rounded-full")

    // Check icon size (w-10 h-10 = 40px)
    expect(iconContainer).toHaveClass("w-10")
    expect(iconContainer).toHaveClass("h-10")
  })

  // Note: forwardRef functionality is tested implicitly in SpeedDialMenu
  // when it passes refs to first menu item for focus management
})
