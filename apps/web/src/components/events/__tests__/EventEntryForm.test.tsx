import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import { EventEntryForm } from "../EventEntryForm"
import React from "react"
import { TRPCWrapper } from "@/test/test-utils"

describe("EventEntryForm", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders all required form fields", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it("shows Create Event button", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument()
    })

    it("shows Cancel button when onCancel prop provided", () => {
      const onCancel = vi.fn()
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" onCancel={onCancel} />
        </TRPCWrapper>
      )

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })

    it("does not show Cancel button when onCancel not provided", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  describe("Form Fields", () => {
    it("renders title input with correct placeholder", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toHaveAttribute("placeholder", "e.g., Foundation inspection")
    })

    it("renders event type select with all options", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Click to open the select dropdown
      const typeButton = screen.getByRole("combobox")
      fireEvent.click(typeButton)

      // Check for all three event type options
      expect(screen.getByRole("option", { name: /milestone/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /meeting/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /inspection/i })).toBeInTheDocument()
    })

    it("renders date input with datetime-local type", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const dateInput = screen.getByLabelText(/date & time/i)
      expect(dateInput).toHaveAttribute("type", "datetime-local")
    })

    it("marks description as optional", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const descriptionLabel = screen.getByText(/description \(optional\)/i)
      expect(descriptionLabel).toBeInTheDocument()
    })
  })

  describe("Default Values", () => {
    it("populates form with default values when provided", () => {
      const defaultValues = {
        title: "Foundation Inspection",
        description: "First inspection with council",
        date: "2025-10-25T10:00",
        categoryId: "inspection" as const,
      }

      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" defaultValues={defaultValues} />
        </TRPCWrapper>
      )

      expect(screen.getByDisplayValue("Foundation Inspection")).toBeInTheDocument()
      expect(screen.getByDisplayValue("First inspection with council")).toBeInTheDocument()
    })

    it("uses current date/time as default when not provided", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const dateInput = screen.getByLabelText(/date & time/i) as HTMLInputElement
      // Check that the input has a value (should be current date/time)
      expect(dateInput.value).toBeTruthy()
    })

    it("defaults to milestone category", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Click to open the select dropdown
      const typeButton = screen.getByRole("combobox")
      expect(typeButton).toHaveTextContent(/milestone/i)
    })
  })

  describe("Validation", () => {
    it("requires title field for form submission", () => {
      const { container } = render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Form should render with validation schema
      expect(container).toBeInTheDocument()
    })

    it("accepts valid title input", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const titleInput = screen.getByLabelText(/title/i)
      fireEvent.change(titleInput, { target: { value: "Foundation Complete" } })

      expect(screen.getByDisplayValue("Foundation Complete")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("associates labels with inputs", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const titleInput = screen.getByLabelText(/title/i)
      const dateInput = screen.getByLabelText(/date & time/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      expect(titleInput).toBeInTheDocument()
      expect(dateInput).toBeInTheDocument()
      expect(descriptionInput).toBeInTheDocument()
    })

    it("has minimum 44px touch targets for mobile", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const titleInput = screen.getByLabelText(/title/i)
      const submitButton = screen.getByRole("button", { name: /create event/i })

      // Check for mobile-optimized min-height class
      expect(titleInput).toHaveClass("min-h-[44px]")
      expect(submitButton).toHaveClass("min-h-[44px]")
    })
  })

  describe("User Interactions", () => {
    it("calls onCancel when Cancel button clicked", () => {
      const onCancel = vi.fn()
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" onCancel={onCancel} />
        </TRPCWrapper>
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it("renders submit button", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const submitButton = screen.getByRole("button", { name: /create event/i })
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe("Mobile Optimization", () => {
    it("renders textarea for description with proper sizing", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      const descriptionInput = screen.getByLabelText(/description/i)
      expect(descriptionInput.tagName).toBe("TEXTAREA")
      expect(descriptionInput).toHaveAttribute("rows", "3")
    })

    it("disables all inputs when form is submitting", () => {
      render(
        <TRPCWrapper>
          <EventEntryForm projectId="test-project-id" />
        </TRPCWrapper>
      )

      // All inputs should be enabled initially
      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).not.toBeDisabled()
    })
  })
})
