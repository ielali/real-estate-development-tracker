import { useEffect, useState } from "react"

/**
 * useDebounce - Hook to debounce a value
 *
 * Returns a debounced value that only updates after the specified delay
 * has passed without the value changing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if value changes before delay expires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
