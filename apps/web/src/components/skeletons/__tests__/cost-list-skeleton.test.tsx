import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import React from "react"
import { CostListSkeleton } from "../cost-list-skeleton"

describe("CostListSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders default number of skeleton items (3)", () => {
      const { container } = render(<CostListSkeleton />)

      const skeletonItems = container.querySelectorAll(".py-3.border-b")
      expect(skeletonItems).toHaveLength(3)
    })

    it("renders custom number of skeleton items when count prop is provided", () => {
      const { container } = render(<CostListSkeleton count={5} />)

      const skeletonItems = container.querySelectorAll(".py-3.border-b")
      expect(skeletonItems).toHaveLength(5)
    })

    it("renders single skeleton item when count is 1", () => {
      const { container } = render(<CostListSkeleton count={1} />)

      const skeletonItems = container.querySelectorAll(".py-3.border-b")
      expect(skeletonItems).toHaveLength(1)
    })

    it("renders no skeleton items when count is 0", () => {
      const { container } = render(<CostListSkeleton count={0} />)

      const skeletonItems = container.querySelectorAll(".py-3.border-b")
      expect(skeletonItems).toHaveLength(0)
    })
  })

  describe("Structure", () => {
    it("uses vertical stack layout for skeleton items", () => {
      const { container } = render(<CostListSkeleton />)

      const wrapper = container.querySelector(".space-y-3")
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass("space-y-3", "animate-pulse")
    })

    it("each skeleton item has cost entry structure", () => {
      const { container } = render(<CostListSkeleton count={1} />)

      // Check for flex layout (matches cost entry structure)
      const item = container.querySelector(".py-3.border-b")
      expect(item).toBeInTheDocument()
      expect(item).toHaveClass("flex", "items-center", "justify-between")

      // Check for placeholder elements
      const placeholders = container.querySelectorAll(".bg-gray-200")
      expect(placeholders.length).toBeGreaterThan(0)
    })

    it("skeleton items have border bottom for separation", () => {
      const { container } = render(<CostListSkeleton count={2} />)

      const items = container.querySelectorAll(".border-b")
      expect(items).toHaveLength(2)
    })
  })

  describe("Animation", () => {
    it("applies pulse animation to skeleton wrapper", () => {
      const { container } = render(<CostListSkeleton count={2} />)

      const wrapper = container.querySelector(".animate-pulse")
      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveClass("animate-pulse")
    })
  })

  describe("Accessibility", () => {
    it("does not trap focus (no interactive elements)", () => {
      const { container } = render(<CostListSkeleton />)

      const buttons = container.querySelectorAll("button")
      const links = container.querySelectorAll("a")

      expect(buttons).toHaveLength(0)
      expect(links).toHaveLength(0)
    })

    it("skeleton does not interfere with screen reader navigation", () => {
      const { container } = render(<CostListSkeleton />)

      // Skeleton should not have aria-live or role attributes
      const wrapper = container.querySelector(".animate-pulse")
      expect(wrapper).not.toHaveAttribute("aria-live")
      expect(wrapper).not.toHaveAttribute("role")
    })
  })
})
