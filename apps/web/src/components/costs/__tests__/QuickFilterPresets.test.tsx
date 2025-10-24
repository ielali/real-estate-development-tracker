/**
 * QuickFilterPresets Component Tests
 */

import React from "react"
import { describe, test, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { QuickFilterPresets } from "../QuickFilterPresets"

describe("QuickFilterPresets", () => {
  afterEach(() => {
    cleanup()
  })

  test("should render all preset buttons", () => {
    const { container } = render(<QuickFilterPresets onPresetSelect={vi.fn()} />)

    expect(container.textContent).toContain("Last 30 days")
    expect(container.textContent).toContain("Over $1,000")
    expect(container.textContent).toContain("This month")
  })

  test("should call onPresetSelect when preset clicked", () => {
    const onPresetSelect = vi.fn()
    const { container } = render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    const button = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Last 30 days")
    )
    if (button) fireEvent.click(button)

    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "last-30-days",
        label: "Last 30 days",
        filters: expect.objectContaining({
          startDate: expect.any(Date),
        }),
      })
    )
  })

  test("should highlight active preset", () => {
    const { container } = render(
      <QuickFilterPresets onPresetSelect={vi.fn()} activePreset="last-30-days" />
    )

    const buttons = Array.from(container.querySelectorAll("button"))
    const activeButton = buttons.find((btn) => btn.textContent?.includes("Last 30 days"))
    const inactiveButton = buttons.find((btn) => btn.textContent?.includes("Over $1,000"))

    // Active button has default variant (bg-gray-900)
    expect(activeButton?.className).toContain("bg-gray-900")
    // Inactive button does not have default variant class
    expect(inactiveButton?.className).not.toContain("bg-gray-900")
  })

  test("should show icons for presets", () => {
    const { container } = render(<QuickFilterPresets onPresetSelect={vi.fn()} />)

    // Check for icon elements (lucide-react renders SVGs)
    const icons = container.querySelectorAll("svg")
    expect(icons.length).toBeGreaterThan(0)
  })

  test("should apply Over $1,000 preset correctly", () => {
    const onPresetSelect = vi.fn()
    const { container } = render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    const button = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Over $1,000")
    )
    if (button) fireEvent.click(button)

    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "over-1000",
        filters: {
          minAmount: 100000, // $1000 in cents
        },
      })
    )
  })

  test("should apply This month preset correctly", () => {
    const onPresetSelect = vi.fn()
    const { container } = render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    const button = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("This month")
    )
    if (button) fireEvent.click(button)

    expect(onPresetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "this-month",
        filters: expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      })
    )
  })
})
