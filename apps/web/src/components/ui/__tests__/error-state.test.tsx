import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import React from "react"
import { ErrorState } from "../error-state"
import { Button } from "../button"

describe("ErrorState", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders error message", () => {
      render(<ErrorState message="Failed to load data" />)

      expect(screen.getByText("Failed to load data")).toBeInTheDocument()
    })

    it("renders title when provided", () => {
      render(<ErrorState title="Error" message="Something went wrong" />)

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("renders without title", () => {
      render(<ErrorState message="An error occurred" />)

      expect(screen.getByText("An error occurred")).toBeInTheDocument()
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    })

    it("renders with action button when provided", () => {
      render(<ErrorState message="Failed to load" action={<Button>Try Again</Button>} />)

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe("Icon display", () => {
    it("shows error icon by default", () => {
      const { container } = render(<ErrorState message="Error occurred" />)

      const icon = container.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })

    it("hides icon when showIcon is false", () => {
      const { container } = render(<ErrorState message="Error occurred" showIcon={false} />)

      const icon = container.querySelector("svg")
      expect(icon).not.toBeInTheDocument()
    })

    it("icon has aria-hidden attribute", () => {
      const { container } = render(<ErrorState message="Error" />)

      const icon = container.querySelector('svg[aria-hidden="true"]')
      expect(icon).toHaveAttribute("aria-hidden", "true")
    })
  })

  describe("Accessibility", () => {
    it("has role=alert for error announcement", () => {
      render(<ErrorState message="Network error" />)

      const alert = screen.getByRole("alert")
      expect(alert).toBeInTheDocument()
    })

    it("has aria-live=polite for screen readers", () => {
      const { container } = render(<ErrorState message="Error loading data" />)

      const alert = container.querySelector('[aria-live="polite"]')
      expect(alert).toBeInTheDocument()
    })

    it("title uses semantic heading when provided", () => {
      render(<ErrorState title="Load Failed" message="Unable to fetch data" />)

      expect(screen.getByRole("heading", { name: /load failed/i })).toBeInTheDocument()
    })

    it("error message is accessible to screen readers", () => {
      render(<ErrorState title="Error" message="Connection timeout" />)

      const message = screen.getByText("Connection timeout")
      expect(message).toBeInTheDocument()
      expect(message.tagName).toBe("P")
    })
  })

  describe("Structure", () => {
    it("centers content vertically and horizontally", () => {
      const { container } = render(<ErrorState message="Error" />)

      const wrapper = container.querySelector(".flex.flex-col.items-center.justify-center")
      expect(wrapper).toBeInTheDocument()
    })

    it("applies appropriate spacing", () => {
      const { container } = render(<ErrorState message="Error" />)

      const wrapper = container.querySelector(".py-12")
      expect(wrapper).toBeInTheDocument()
    })

    it("centers text alignment", () => {
      const { container } = render(<ErrorState message="Error" />)

      const wrapper = container.querySelector(".text-center")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("Styling", () => {
    it("applies error color to icon", () => {
      const { container } = render(<ErrorState message="Error" />)

      const icon = container.querySelector(".text-red-500")
      expect(icon).toBeInTheDocument()
    })

    it("constrains message width for readability", () => {
      render(<ErrorState message="This is a long error message" />)

      const message = screen.getByText(/this is a long error message/i)
      expect(message).toHaveClass("max-w-sm")
    })
  })
})
