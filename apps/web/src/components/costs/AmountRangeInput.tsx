/**
 * AmountRangeInput - Component for filtering costs by amount range
 *
 * Provides min and max amount inputs with dollar formatting.
 * Converts between dollars (user input) and cents (internal representation).
 */

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatAmountForDisplay, parseAmountToCents } from "@/lib/utils/cost-filters"

export interface AmountRangeInputProps {
  minAmount?: number // in cents
  maxAmount?: number // in cents
  onMinChange: (cents: number | undefined) => void
  onMaxChange: (cents: number | undefined) => void
}

export function AmountRangeInput({
  minAmount,
  maxAmount,
  onMinChange,
  onMaxChange,
}: AmountRangeInputProps) {
  const minDollars = minAmount !== undefined ? formatAmountForDisplay(minAmount) : ""
  const maxDollars = maxAmount !== undefined ? formatAmountForDisplay(maxAmount) : ""

  const handleMinChange = (value: string) => {
    if (value === "") {
      onMinChange(undefined)
    } else {
      const cents = parseAmountToCents(value)
      onMinChange(cents)
    }
  }

  const handleMaxChange = (value: string) => {
    if (value === "") {
      onMaxChange(undefined)
    } else {
      const cents = parseAmountToCents(value)
      onMaxChange(cents)
    }
  }

  return (
    <div className="space-y-2">
      <Label>Amount Range</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="min-amount" className="text-xs text-muted-foreground">
            Min
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
            <Input
              id="min-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={minDollars}
              onChange={(e) => handleMinChange(e.target.value)}
              className="pl-6"
              aria-label="Minimum amount in dollars"
            />
          </div>
        </div>
        <span className="pt-6 text-muted-foreground">to</span>
        <div className="flex-1">
          <Label htmlFor="max-amount" className="text-xs text-muted-foreground">
            Max
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
            <Input
              id="max-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={maxDollars}
              onChange={(e) => handleMaxChange(e.target.value)}
              className="pl-6"
              aria-label="Maximum amount in dollars"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
