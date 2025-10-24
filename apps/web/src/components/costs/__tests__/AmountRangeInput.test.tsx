/**
 * AmountRangeInput Component Tests
 */

import React from "react"
import { describe, test, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { AmountRangeInput } from "../AmountRangeInput"

describe("AmountRangeInput", () => {
  afterEach(() => {
    cleanup()
  })

  test("should render min and max inputs", () => {
    const { container } = render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
      />
    )

    expect(container.querySelector('[aria-label*="Minimum amount"]')).toBeInTheDocument()
    expect(container.querySelector('[aria-label*="Maximum amount"]')).toBeInTheDocument()
  })

  test("should display current values in dollars", () => {
    const { container } = render(
      <AmountRangeInput
        minAmount={100000} // $1000
        maxAmount={500000} // $5000
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = container.querySelector('[aria-label*="Minimum amount"]') as HTMLInputElement
    const maxInput = container.querySelector('[aria-label*="Maximum amount"]') as HTMLInputElement

    expect(minInput.value).toBe("1000.00")
    expect(maxInput.value).toBe("5000.00")
  })

  test("should call onMinChange with cents when user enters dollars", () => {
    const onMinChange = vi.fn()
    const { container } = render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = container.querySelector('[aria-label*="Minimum amount"]') as HTMLInputElement
    fireEvent.change(minInput, { target: { value: "1000.00" } })

    expect(onMinChange).toHaveBeenCalledWith(100000) // $1000 in cents
  })

  test("should call onMaxChange with cents when user enters dollars", () => {
    const onMaxChange = vi.fn()
    const { container } = render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={vi.fn()}
        onMaxChange={onMaxChange}
      />
    )

    const maxInput = container.querySelector('[aria-label*="Maximum amount"]') as HTMLInputElement
    fireEvent.change(maxInput, { target: { value: "5000.00" } })

    expect(onMaxChange).toHaveBeenCalledWith(500000) // $5000 in cents
  })

  test("should call onChange with undefined when input is cleared", () => {
    const onMinChange = vi.fn()
    const { container } = render(
      <AmountRangeInput
        minAmount={100000}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = container.querySelector('[aria-label*="Minimum amount"]') as HTMLInputElement
    fireEvent.change(minInput, { target: { value: "" } })

    expect(onMinChange).toHaveBeenCalledWith(undefined)
  })

  test("should handle decimal inputs", () => {
    const onMinChange = vi.fn()
    const { container } = render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = container.querySelector('[aria-label*="Minimum amount"]') as HTMLInputElement
    fireEvent.change(minInput, { target: { value: "123.45" } })

    expect(onMinChange).toHaveBeenCalledWith(12345) // $123.45 in cents
  })

  test("should show dollar sign indicators", () => {
    render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
      />
    )

    const dollarSigns = screen.getAllByText("$")
    expect(dollarSigns).toHaveLength(2)
  })
})
