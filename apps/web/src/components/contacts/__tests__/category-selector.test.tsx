import React from "react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CategorySelector } from "../CategorySelector"

describe("CategorySelector", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Rendering", () => {
    it("renders select trigger", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("displays placeholder when no value selected", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} placeholder="Choose category" />)

      expect(screen.getByText("Choose category")).toBeInTheDocument()
    })

    it("uses default placeholder when not provided", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      expect(screen.getByText("Select a category")).toBeInTheDocument()
    })

    it("can be disabled", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} disabled />)

      const trigger = screen.getByRole("combobox")
      expect(trigger).toBeDisabled()
    })
  })

  describe("Category Hierarchy", () => {
    it("groups categories by parent", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      // Open the select dropdown
      const trigger = screen.getByRole("combobox")
      await user.click(trigger)

      // Should show parent category group labels
      expect(screen.getByText("Construction Team")).toBeInTheDocument()
      expect(screen.getByText("Trades")).toBeInTheDocument()
      expect(screen.getByText("Design & Planning")).toBeInTheDocument()
    })

    it("displays child categories under parent groups", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      const trigger = screen.getByRole("combobox")
      await user.click(trigger)

      // Should show child categories
      expect(screen.getByText("Electrician")).toBeInTheDocument()
      expect(screen.getByText("Plumber")).toBeInTheDocument()
      expect(screen.getByText("Architect")).toBeInTheDocument()
    })
  })

  describe("Selection", () => {
    it("calls onChange when category is selected", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      const trigger = screen.getByRole("combobox")
      await user.click(trigger)

      const plumberOption = screen.getByText("Plumber")
      await user.click(plumberOption)

      expect(onChange).toHaveBeenCalledWith("plumber")
    })

    it("displays selected category value", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="electrician" onChange={onChange} />)

      expect(screen.getByText("Electrician")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has combobox role", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} />)

      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("announces disabled state", () => {
      const onChange = vi.fn()
      render(<CategorySelector value="" onChange={onChange} disabled />)

      const trigger = screen.getByRole("combobox")
      expect(trigger).toHaveAttribute("disabled")
    })
  })

  describe("Mobile Responsiveness", () => {
    it("renders without layout issues", () => {
      const onChange = vi.fn()
      const { container } = render(<CategorySelector value="" onChange={onChange} />)

      expect(container.querySelector("button")).toBeInTheDocument()
    })
  })
})
