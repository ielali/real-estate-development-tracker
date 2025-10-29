/**
 * ProjectSummaryCard Component Tests
 *
 * Story 4.3 - Partner Dashboard
 *
 * Tests for the ProjectSummaryCard component to ensure it correctly displays
 * project summary metrics, status badges, and dates.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ProjectSummaryCard, type ProjectSummaryCardProps } from "../ProjectSummaryCard"

describe("ProjectSummaryCard", () => {
  const mockProps: ProjectSummaryCardProps = {
    project: {
      id: "project-123",
      name: "Test Project",
      description: "A test project description",
      address: {
        formattedAddress: "123 Test St, Sydney NSW 2000",
      },
      projectType: "residential",
      status: "active",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
    totalSpent: 250000_00, // $250,000.00 in cents
    documentCount: 15,
    recentActivityCount: 8,
  }

  describe("Rendering", () => {
    it("should render project name", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("Test Project")).toBeInTheDocument()
    })

    it("should render project description", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("A test project description")).toBeInTheDocument()
    })

    it("should render formatted address", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("123 Test St, Sydney NSW 2000")).toBeInTheDocument()
    })

    it("should render project without description", () => {
      const propsWithoutDescription = {
        ...mockProps,
        project: {
          ...mockProps.project,
          description: null,
        },
      }
      render(<ProjectSummaryCard {...propsWithoutDescription} />)
      expect(screen.getByText("Test Project")).toBeInTheDocument()
    })

    it("should render project without address", () => {
      const propsWithoutAddress = {
        ...mockProps,
        project: {
          ...mockProps.project,
          address: null,
        },
      }
      const { container } = render(<ProjectSummaryCard {...propsWithoutAddress} />)
      // Should not crash and should render the component
      expect(container.querySelector('[class*="card"]')).toBeInTheDocument()
    })
  })

  describe("Metrics Display", () => {
    it("should display total spent formatted as currency", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("$250,000.00")).toBeInTheDocument()
    })

    it("should display document count", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("15")).toBeInTheDocument()
      expect(screen.getByText(/documents?/i)).toBeInTheDocument()
    })

    it("should display recent activity count", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("8")).toBeInTheDocument()
      expect(screen.getByText(/recent updates?/i)).toBeInTheDocument()
    })

    it("should handle zero total spent", () => {
      const propsWithZeroSpent = {
        ...mockProps,
        totalSpent: 0,
      }
      render(<ProjectSummaryCard {...propsWithZeroSpent} />)
      expect(screen.getByText("$0.00")).toBeInTheDocument()
    })

    it("should handle large amounts correctly", () => {
      const propsWithLargeAmount = {
        ...mockProps,
        totalSpent: 1500000_00, // $1,500,000.00
      }
      render(<ProjectSummaryCard {...propsWithLargeAmount} />)
      expect(screen.getByText("$1,500,000.00")).toBeInTheDocument()
    })
  })

  describe("Status Badge", () => {
    it("should display active status badge", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText("Active")).toBeInTheDocument()
    })

    it("should display on-hold status badge", () => {
      const propsWithOnHoldStatus = {
        ...mockProps,
        project: {
          ...mockProps.project,
          status: "on-hold" as const,
        },
      }
      render(<ProjectSummaryCard {...propsWithOnHoldStatus} />)
      expect(screen.getByText("On Hold")).toBeInTheDocument()
    })

    it("should display completed status badge", () => {
      const propsWithCompletedStatus = {
        ...mockProps,
        project: {
          ...mockProps.project,
          status: "completed" as const,
        },
      }
      render(<ProjectSummaryCard {...propsWithCompletedStatus} />)
      expect(screen.getByText("Completed")).toBeInTheDocument()
    })
  })

  describe("Dates", () => {
    it("should display start date", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      // Date format will depend on the component implementation
      expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument()
    })

    it("should display end date when provided", () => {
      render(<ProjectSummaryCard {...mockProps} />)
      expect(screen.getByText(/Dec 31, 2024/i)).toBeInTheDocument()
    })

    it("should handle null end date", () => {
      const propsWithoutEndDate = {
        ...mockProps,
        project: {
          ...mockProps.project,
          endDate: null,
        },
      }
      const { container } = render(<ProjectSummaryCard {...propsWithoutEndDate} />)
      // Should render without error
      expect(container).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle singular document count", () => {
      const propsWithOneDocument = {
        ...mockProps,
        documentCount: 1,
      }
      render(<ProjectSummaryCard {...propsWithOneDocument} />)
      expect(screen.getByText("1")).toBeInTheDocument()
    })

    it("should handle zero document count", () => {
      const propsWithZeroDocuments = {
        ...mockProps,
        documentCount: 0,
      }
      render(<ProjectSummaryCard {...propsWithZeroDocuments} />)
      expect(screen.getByText("0")).toBeInTheDocument()
    })

    it("should handle zero activity count", () => {
      const propsWithZeroActivity = {
        ...mockProps,
        recentActivityCount: 0,
      }
      render(<ProjectSummaryCard {...propsWithZeroActivity} />)
      expect(screen.getByText("0")).toBeInTheDocument()
    })
  })
})
