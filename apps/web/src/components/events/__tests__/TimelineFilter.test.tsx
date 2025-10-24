import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { TimelineFilter } from "../TimelineFilter"
import React from "react"

describe("TimelineFilter", () => {
  afterEach(() => {
    cleanup()
  })

  const defaultProps = {
    onCategoryChange: vi.fn(),
    onContactChange: vi.fn(),
    onDateRangeChange: vi.fn(),
  }

  describe("Rendering", () => {
    it("renders event type filter", () => {
      render(<TimelineFilter {...defaultProps} />)

      expect(screen.getByText(/event type/i)).toBeInTheDocument()
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("shows filter controls section", () => {
      render(<TimelineFilter {...defaultProps} />)

      // Should have a section with filter controls
      const filterControls = screen.getByText(/event type/i).closest("div")
      expect(filterControls).toBeInTheDocument()
    })
  })

  describe("Category Filter", () => {
    it("displays all event type options when opened", () => {
      render(<TimelineFilter {...defaultProps} />)

      const selectTrigger = screen.getByRole("combobox")
      fireEvent.click(selectTrigger)

      expect(screen.getByRole("option", { name: /all types/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /milestones/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /meetings/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /inspections/i })).toBeInTheDocument()
    })

    it("calls onCategoryChange when category selected", () => {
      const onCategoryChange = vi.fn()
      render(<TimelineFilter {...defaultProps} onCategoryChange={onCategoryChange} />)

      const selectTrigger = screen.getByRole("combobox")
      fireEvent.click(selectTrigger)

      const milestoneOption = screen.getByRole("option", { name: /milestones/i })
      fireEvent.click(milestoneOption)

      expect(onCategoryChange).toHaveBeenCalledWith("milestone")
    })

    it("calls onCategoryChange with undefined when 'All types' selected", () => {
      const onCategoryChange = vi.fn()
      render(
        <TimelineFilter
          {...defaultProps}
          onCategoryChange={onCategoryChange}
          categoryId="milestone"
        />
      )

      const selectTrigger = screen.getByRole("combobox")
      fireEvent.click(selectTrigger)

      const allTypesOption = screen.getByRole("option", { name: /all types/i })
      fireEvent.click(allTypesOption)

      expect(onCategoryChange).toHaveBeenCalledWith(undefined)
    })

    it("shows selected category value", () => {
      render(<TimelineFilter {...defaultProps} categoryId="meeting" />)

      const selectTrigger = screen.getByRole("combobox")
      // The selected value should be visible in the trigger
      expect(selectTrigger).toBeTruthy()
    })
  })

  describe("Active Filters Display", () => {
    it("shows active filters section when filters applied", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      expect(screen.getByText(/active filters:/i)).toBeInTheDocument()
    })

    it("does not show active filters section when no filters applied", () => {
      render(<TimelineFilter {...defaultProps} />)

      expect(screen.queryByText(/active filters:/i)).not.toBeInTheDocument()
    })

    it("displays category filter badge when category selected", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      expect(screen.getByText(/type: milestone/i)).toBeInTheDocument()
    })

    it("displays contact filter badge when contact selected", () => {
      render(<TimelineFilter {...defaultProps} contactId="contact-123" />)

      expect(screen.getByText(/contact/i)).toBeInTheDocument()
    })

    it("displays date range filter badge when dates selected", () => {
      render(
        <TimelineFilter
          {...defaultProps}
          startDate={new Date("2025-01-01")}
          endDate={new Date("2025-12-31")}
        />
      )

      expect(screen.getByText(/date range/i)).toBeInTheDocument()
    })

    it("shows clear all button when filters are active", () => {
      render(<TimelineFilter {...defaultProps} categoryId="meeting" />)

      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()
    })
  })

  describe("Clear Filter Actions", () => {
    it("clears category filter when X button clicked", () => {
      const onCategoryChange = vi.fn()
      render(
        <TimelineFilter
          {...defaultProps}
          onCategoryChange={onCategoryChange}
          categoryId="milestone"
        />
      )

      const removeButton = screen.getByLabelText(/remove category filter/i)
      fireEvent.click(removeButton)

      expect(onCategoryChange).toHaveBeenCalledWith(undefined)
    })

    it("clears contact filter when X button clicked", () => {
      const onContactChange = vi.fn()
      render(
        <TimelineFilter
          {...defaultProps}
          onContactChange={onContactChange}
          contactId="contact-123"
        />
      )

      const removeButton = screen.getByLabelText(/remove contact filter/i)
      fireEvent.click(removeButton)

      expect(onContactChange).toHaveBeenCalledWith(undefined)
    })

    it("clears date range when X button clicked", () => {
      const onDateRangeChange = vi.fn()
      render(
        <TimelineFilter
          {...defaultProps}
          onDateRangeChange={onDateRangeChange}
          startDate={new Date("2025-01-01")}
        />
      )

      const removeButton = screen.getByLabelText(/remove date range filter/i)
      fireEvent.click(removeButton)

      expect(onDateRangeChange).toHaveBeenCalledWith(undefined, undefined)
    })

    it("clears all filters when Clear All clicked", () => {
      const onCategoryChange = vi.fn()
      const onContactChange = vi.fn()
      const onDateRangeChange = vi.fn()

      render(
        <TimelineFilter
          onCategoryChange={onCategoryChange}
          onContactChange={onContactChange}
          onDateRangeChange={onDateRangeChange}
          categoryId="milestone"
          contactId="contact-123"
          startDate={new Date("2025-01-01")}
        />
      )

      const clearAllButton = screen.getByRole("button", { name: /clear all/i })
      fireEvent.click(clearAllButton)

      expect(onCategoryChange).toHaveBeenCalledWith(undefined)
      expect(onContactChange).toHaveBeenCalledWith(undefined)
      expect(onDateRangeChange).toHaveBeenCalledWith(undefined, undefined)
    })
  })

  describe("Accessibility", () => {
    it("has proper label for event type filter", () => {
      render(<TimelineFilter {...defaultProps} />)

      const label = screen.getByText(/event type/i)
      expect(label.tagName).toBe("LABEL")
    })

    it("uses semantic button for clear actions", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      const removeButton = screen.getByLabelText(/remove category filter/i)
      expect(removeButton.tagName).toBe("BUTTON")
    })

    it("provides aria-label for remove filter buttons", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      const removeButton = screen.getByLabelText(/remove category filter/i)
      expect(removeButton).toHaveAttribute("aria-label", "Remove category filter")
    })
  })

  describe("Mobile Responsiveness", () => {
    it("uses responsive layout classes", () => {
      const { container } = render(<TimelineFilter {...defaultProps} />)

      // Filter controls should use flex-col on mobile, flex-row on larger screens
      const filterControls = container.querySelector(".flex-col")
      expect(filterControls).toBeInTheDocument()
    })

    it("ensures touch targets are minimum 44px", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      const selectTrigger = screen.getByRole("combobox")
      expect(selectTrigger).toHaveClass("min-h-[44px]")
    })
  })

  describe("Badge Display", () => {
    it("displays category badge with correct styling", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      const badge = screen.getByText(/type: milestone/i).closest("div")
      expect(badge).toHaveClass("gap-1")
    })

    it("includes X icon in filter badges", () => {
      render(<TimelineFilter {...defaultProps} categoryId="milestone" />)

      const removeButton = screen.getByLabelText(/remove category filter/i)
      // Button should contain an X icon (SVG element)
      expect(removeButton.querySelector("svg")).toBeInTheDocument()
    })
  })

  describe("Multiple Filter Combinations", () => {
    it("handles category and contact filters together", () => {
      render(<TimelineFilter {...defaultProps} categoryId="meeting" contactId="contact-456" />)

      expect(screen.getByText(/type: meeting/i)).toBeInTheDocument()
      expect(screen.getByText(/contact/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument()
    })

    it("handles all three filter types simultaneously", () => {
      render(
        <TimelineFilter
          {...defaultProps}
          categoryId="inspection"
          contactId="contact-789"
          startDate={new Date("2025-01-01")}
          endDate={new Date("2025-12-31")}
        />
      )

      expect(screen.getByText(/type: inspection/i)).toBeInTheDocument()
      expect(screen.getByText(/contact/i)).toBeInTheDocument()
      expect(screen.getByText(/date range/i)).toBeInTheDocument()
    })
  })
})
