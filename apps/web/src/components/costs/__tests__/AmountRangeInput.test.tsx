/**
 * AmountRangeInput Component Tests
 */

import React from "react"
import { describe, test, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AmountRangeInput } from "../AmountRangeInput"

describe("AmountRangeInput", () => {
  test("should render min and max inputs", () => {
    render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/minimum amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/maximum amount/i)).toBeInTheDocument()
  })

  test("should display current values in dollars", () => {
    render(
      <AmountRangeInput
        minAmount={100000} // $1000
        maxAmount={500000} // $5000
        onMinChange={vi.fn()}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = screen.getByLabelText(/minimum amount/i) as HTMLInputElement
    const maxInput = screen.getByLabelText(/maximum amount/i) as HTMLInputElement

    expect(minInput.value).toBe("1000.00")
    expect(maxInput.value).toBe("5000.00")
  })

  test("should call onMinChange with cents when user enters dollars", () => {
    const onMinChange = vi.fn()
    render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = screen.getByLabelText(/minimum amount/i)
    fireEvent.change(minInput, { target: { value: "1000.00" } })

    expect(onMinChange).toHaveBeenCalledWith(100000) // $1000 in cents
  })

  test("should call onMaxChange with cents when user enters dollars", () => {
    const onMaxChange = vi.fn()
    render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={vi.fn()}
        onMaxChange={onMaxChange}
      />
    )

    const maxInput = screen.getByLabelText(/maximum amount/i)
    fireEvent.change(maxInput, { target: { value: "5000.00" } })

    expect(onMaxChange).toHaveBeenCalledWith(500000) // $5000 in cents
  })

  test("should call onChange with undefined when input is cleared", () => {
    const onMinChange = vi.fn()
    render(
      <AmountRangeInput
        minAmount={100000}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = screen.getByLabelText(/minimum amount/i)
    fireEvent.change(minInput, { target: { value: "" } })

    expect(onMinChange).toHaveBeenCalledWith(undefined)
  })

  test("should handle decimal inputs", () => {
    const onMinChange = vi.fn()
    render(
      <AmountRangeInput
        minAmount={undefined}
        maxAmount={undefined}
        onMinChange={onMinChange}
        onMaxChange={vi.fn()}
      />
    )

    const minInput = screen.getByLabelText(/minimum amount/i)
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
