/**
 * useDebounce Hook Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useDebounce } from "../useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("test", 300))
    expect(result.current).toBe("test")
  })

  test("should debounce value changes", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "initial" },
    })

    expect(result.current).toBe("initial")

    // Update value
    rerender({ value: "updated" })

    // Should still have old value immediately
    expect(result.current).toBe("initial")

    // Advance timers and wait for state update
    await vi.advanceTimersByTimeAsync(300)

    // Should have new value after delay
    expect(result.current).toBe("updated")
  })

  test("should cancel previous timeout on rapid changes", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "first" },
    })

    // Make rapid changes without advancing timers enough to trigger
    rerender({ value: "second" })
    await vi.advanceTimersByTimeAsync(100)

    rerender({ value: "third" })
    await vi.advanceTimersByTimeAsync(100)

    rerender({ value: "fourth" })

    // Now advance the full debounce delay from the last change
    await vi.advanceTimersByTimeAsync(300)

    // Should only have the last value, all previous debounces should be cancelled
    expect(result.current).toBe("fourth")
  })

  test("should use custom delay", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "updated" })

    await vi.advanceTimersByTimeAsync(300)
    expect(result.current).toBe("initial")

    await vi.advanceTimersByTimeAsync(200)
    expect(result.current).toBe("updated")
  })

  test("should work with different types", async () => {
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    )

    numberRerender({ value: 42 })
    await vi.advanceTimersByTimeAsync(300)

    expect(numberResult.current).toBe(42)

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: { foo: "bar" } },
      }
    )

    objectRerender({ value: { foo: "baz" } })
    await vi.advanceTimersByTimeAsync(300)

    expect(objectResult.current).toEqual({ foo: "baz" })
  })
})
