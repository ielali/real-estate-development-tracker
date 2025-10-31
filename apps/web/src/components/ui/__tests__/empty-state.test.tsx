/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup, within } from "@testing-library/react"
import React from "react"
import { EmptyState } from "../empty-state"
import { Button } from "../button"

describe("EmptyState", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders title and description", () => {
      render(
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started"
        />
      )

      expect(screen.getByText("No projects yet")).toBeInTheDocument()
      expect(screen.getByText("Create your first project to get started")).toBeInTheDocument()
    })

    it("renders without action button", () => {
      const { container } = render(
        <EmptyState title="No items" description="There are no items to display" />
      )

      expect(within(container).getByText("No items")).toBeInTheDocument()
      expect(within(container).queryByRole("button")).not.toBeInTheDocument()
    })

    it("renders with action button when provided", () => {
      render(
        <EmptyState
          title="No projects"
          description="Get started by creating a project"
          action={<Button>Create Project</Button>}
        />
      )

      expect(screen.getByRole("button", { name: /create project/i })).toBeInTheDocument()
    })
  })

  describe("Structure", () => {
    it("displays icon/illustration when provided", () => {
      const { container } = render(
        <EmptyState
          icon={() => (
            <svg data-testid="test-icon">
              <circle />
            </svg>
          )}
          title="Empty"
          description="No content available"
        />
      )

      // Check for SVG icon
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })

    it("renders without icon when not provided", () => {
      const { container } = render(<EmptyState title="Empty" description="No content available" />)

      // Should not have SVG icon
      const svg = container.querySelector("svg")
      expect(svg).not.toBeInTheDocument()
    })

    it("centers content vertically and horizontally", () => {
      const { container } = render(<EmptyState title="Empty" description="No content" />)

      const wrapper = container.querySelector(".flex.flex-col.items-center.justify-center")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("uses semantic heading for title", () => {
      render(<EmptyState title="No results found" description="Try adjusting your search" />)

      expect(screen.getByRole("heading", { name: /no results found/i })).toBeInTheDocument()
    })

    it("has proper text hierarchy", () => {
      const { container } = render(
        <EmptyState title="No data" description="There is no data to display at this time" />
      )

      const heading = container.querySelector("h3")
      const description = screen.getByText(/there is no data/i)

      // Heading should be h3
      expect(heading).toBeInTheDocument()
      expect(heading?.tagName).toBe("H3")

      // Description should be paragraph
      expect(description.tagName).toBe("P")
    })
  })

  describe("Styling", () => {
    it("applies padding for spacing", () => {
      const { container } = render(<EmptyState title="Empty" description="No content" />)

      const wrapper = container.querySelector(".p-8")
      expect(wrapper).toBeInTheDocument()
    })

    it("applies text center alignment", () => {
      const { container } = render(<EmptyState title="Empty" description="No content" />)

      const wrapper = container.querySelector(".text-center")
      expect(wrapper).toBeInTheDocument()
    })
  })
})
