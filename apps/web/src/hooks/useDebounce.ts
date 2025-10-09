/**
 * Custom hook for debouncing values
 *
 * Delays updating the value until the specified delay has passed
 * without the value changing. Useful for search inputs to reduce
 * the number of API calls.
 */

import { useState, useEffect } from "react"

/**
 * Debounce a value
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up timeout if value changes before delay completes
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
