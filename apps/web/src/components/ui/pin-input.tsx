"use client"

import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react"
import { cn } from "@/lib/utils"

interface PinInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * PinInput - Individual digit input fields for PIN/OTP entry
 *
 * Features:
 * - Auto-focus next field on input
 * - Auto-focus previous field on backspace
 * - Paste support (splits pasted value across fields)
 * - Auto-submit when all digits entered
 * - Keyboard navigation (arrow keys)
 */
export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  className,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""))

  // Update digits when value changes FROM PARENT (e.g., when cleared on error)
  useEffect(() => {
    if (value === "") {
      // Only reset if explicitly cleared by parent
      setDigits(Array(length).fill(""))
    } else if (value.length > 0) {
      // Update from parent value if it has content
      const newDigits = value.padEnd(length, "").slice(0, length).split("")
      setDigits(newDigits)
    }
  }, [value, length])

  // Auto-focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, "").slice(-1)

    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)

    const newCode = newDigits.join("")
    onChange(newCode)

    // Auto-focus next field if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits filled
    if (digit && index === length - 1 && newCode.length === length) {
      onComplete?.(newCode)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current or move to previous
    if (e.key === "Backspace") {
      e.preventDefault()
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits]
        newDigits[index] = ""
        setDigits(newDigits)
        onChange(newDigits.join(""))
      } else if (index > 0) {
        // Move to previous and clear it
        const newDigits = [...digits]
        newDigits[index - 1] = ""
        setDigits(newDigits)
        onChange(newDigits.join(""))
        inputRefs.current[index - 1]?.focus()
      }
    }

    // Arrow Left: move to previous field
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }

    // Arrow Right: move to next field
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain")
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, length)

    const newDigits = pastedDigits.padEnd(length, "").split("")
    setDigits(newDigits)
    onChange(pastedDigits)

    // Focus last filled input or first empty input
    const nextIndex = Math.min(pastedDigits.length, length - 1)
    inputRefs.current[nextIndex]?.focus()

    // Call onComplete if all digits filled
    if (pastedDigits.length === length) {
      onComplete?.(pastedDigits)
    }
  }

  const handleFocus = (index: number) => {
    // Select all text in the input for easy replacement
    inputRefs.current[index]?.select()
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "h-12 w-12 text-center text-2xl font-semibold",
            "rounded-md border border-input bg-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all",
            digit && "border-primary"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
