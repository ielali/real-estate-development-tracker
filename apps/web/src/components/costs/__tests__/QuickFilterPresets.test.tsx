/**
 * QuickFilterPresets Component Tests
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QuickFilterPresets } from "../QuickFilterPresets"

describe("QuickFilterPresets", () => {
  test("should render all preset buttons", () => {
    render(<QuickFilterPresets onPresetSelect={vi.fn()} />)

    expect(screen.getByText("Last 30 days")).toBeInTheDocument()
    expect(screen.getByText("Over $1,000")).toBeInTheDocument()
    expect(screen.getByText("This month")).toBeInTheDocument()
  })

  test("should call onPresetSelect when preset clicked", () => {
    const onPresetSelect = vi.fn()
    render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    fireEvent.click(screen.getByText("Last 30 days"))

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
    render(<QuickFilterPresets onPresetSelect={vi.fn()} activePreset="last-30-days" />)

    const activeButton = screen.getByText("Last 30 days").closest("button")
    const inactiveButton = screen.getByText("Over $1,000").closest("button")

    expect(activeButton).toHaveClass("bg-primary") // or whatever active class
    expect(inactiveButton).not.toHaveClass("bg-primary")
  })

  test("should show icons for presets", () => {
    const { container } = render(<QuickFilterPresets onPresetSelect={vi.fn()} />)

    // Check for icon elements (lucide-react renders SVGs)
    const icons = container.querySelectorAll("svg")
    expect(icons.length).toBeGreaterThan(0)
  })

  test("should apply Over $1,000 preset correctly", () => {
    const onPresetSelect = vi.fn()
    render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    fireEvent.click(screen.getByText("Over $1,000"))

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
    render(<QuickFilterPresets onPresetSelect={onPresetSelect} />)

    fireEvent.click(screen.getByText("This month"))

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
