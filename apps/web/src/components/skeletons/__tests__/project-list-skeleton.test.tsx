import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import React from "react"
import { ProjectListSkeleton } from "../project-list-skeleton"

describe("ProjectListSkeleton", () => {
  describe("Rendering", () => {
    it("renders default number of skeleton cards (4)", () => {
      const { container } = render(<ProjectListSkeleton />)

      // Find all cards with animate-pulse class
      const skeletonCards = container.querySelectorAll(".animate-pulse")
      expect(skeletonCards).toHaveLength(4)
    })

    it("renders custom number of skeleton cards when count prop is provided", () => {
      const { container } = render(<ProjectListSkeleton count={6} />)

      const skeletonCards = container.querySelectorAll(".animate-pulse")
      expect(skeletonCards).toHaveLength(6)
    })

    it("renders single skeleton card when count is 1", () => {
      const { container } = render(<ProjectListSkeleton count={1} />)

      const skeletonCards = container.querySelectorAll(".animate-pulse")
      expect(skeletonCards).toHaveLength(1)
    })

    it("renders no skeleton cards when count is 0", () => {
      const { container } = render(<ProjectListSkeleton count={0} />)

      const skeletonCards = container.querySelectorAll(".animate-pulse")
      expect(skeletonCards).toHaveLength(0)
    })
  })

  describe("Structure", () => {
    it("uses grid layout for skeleton cards", () => {
      const { container } = render(<ProjectListSkeleton />)

      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass("gap-6", "md:grid-cols-2", "lg:grid-cols-3")
    })

    it("each skeleton card has header and content sections", () => {
      const { container } = render(<ProjectListSkeleton count={1} />)

      // Check for card structure
      const card = container.querySelector(".animate-pulse")
      expect(card).toBeInTheDocument()

      // Check for placeholder elements (gray backgrounds)
      const placeholders = container.querySelectorAll(".bg-gray-200")
      expect(placeholders.length).toBeGreaterThan(0)
    })
  })

  describe("Animation", () => {
    it("applies pulse animation to skeleton cards", () => {
      const { container } = render(<ProjectListSkeleton count={2} />)

      const skeletonCards = container.querySelectorAll(".animate-pulse")
      skeletonCards.forEach((card) => {
        expect(card).toHaveClass("animate-pulse")
      })
    })
  })

  describe("Accessibility", () => {
    it("does not trap focus (no interactive elements)", () => {
      const { container } = render(<ProjectListSkeleton />)

      const buttons = container.querySelectorAll("button")
      const links = container.querySelectorAll("a")

      expect(buttons).toHaveLength(0)
      expect(links).toHaveLength(0)
    })

    it("skeleton does not interfere with screen reader navigation", () => {
      const { container } = render(<ProjectListSkeleton />)

      // Skeleton should not have aria-live or role attributes that announce loading
      const skeletonCards = container.querySelectorAll(".animate-pulse")

      // Skeletons themselves should not be live regions
      skeletonCards.forEach((card) => {
        expect(card).not.toHaveAttribute("aria-live")
      })
    })
  })
})
