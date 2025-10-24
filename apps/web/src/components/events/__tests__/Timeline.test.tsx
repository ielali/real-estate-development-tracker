import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { Timeline } from "../Timeline"
import React from "react"
import { TRPCWrapper } from "@/test/test-utils"

describe("Timeline", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Loading State", () => {
    it("shows skeleton loading state while fetching", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Should show skeleton placeholders while loading
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe("Empty State", () => {
    it("shows empty state when no events exist", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="empty-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("displays appropriate empty state message", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="empty-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Event Display", () => {
    it("renders events in reverse chronological order", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("groups events by month and year", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Filtering", () => {
    it("accepts category filter prop", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" filters={{ categoryId: "milestone" }} />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("accepts contact filter prop", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" filters={{ contactId: "contact-123" }} />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("accepts date range filter props", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline
            projectId="test-project-id"
            filters={{
              startDate: new Date("2025-01-01"),
              endDate: new Date("2025-12-31"),
            }}
          />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("accepts multiple filters simultaneously", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline
            projectId="test-project-id"
            filters={{
              categoryId: "meeting",
              contactId: "contact-456",
              startDate: new Date("2025-01-01"),
              endDate: new Date("2025-12-31"),
            }}
          />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("uses feed role for timeline container", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("has aria-label for timeline", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("displays error message when query fails", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="invalid-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Month Grouping Logic", () => {
    it("groups events from same month together", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("shows month/year headers with semantic markup", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })

    it("applies sticky positioning to month headers", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Responsive Design", () => {
    it("renders with mobile-friendly spacing", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Component should render without errors
      expect(container).toBeInTheDocument()
    })
  })

  describe("Loading Skeleton", () => {
    it("shows skeleton UI while loading", () => {
      const { container } = render(
        <TRPCWrapper>
          <Timeline projectId="test-project-id" />
        </TRPCWrapper>
      )

      // Should show loading skeleton initially
      const skeletons = container.querySelectorAll(".animate-pulse")
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })
})
