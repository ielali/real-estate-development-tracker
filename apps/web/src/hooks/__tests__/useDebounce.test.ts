/**
 * useDebounce Hook Tests
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
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

    // Advance timers
    vi.advanceTimersByTime(300)

    // Should have new value after delay
    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })

  test("should cancel previous timeout on rapid changes", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "first" },
    })

    rerender({ value: "second" })
    vi.advanceTimersByTime(100)

    rerender({ value: "third" })
    vi.advanceTimersByTime(100)

    rerender({ value: "fourth" })
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(result.current).toBe("fourth")
    })
  })

  test("should use custom delay", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "updated" })

    vi.advanceTimersByTime(300)
    expect(result.current).toBe("initial")

    vi.advanceTimersByTime(200)
    await waitFor(() => {
      expect(result.current).toBe("updated")
    })
  })

  test("should work with different types", async () => {
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    )

    numberRerender({ value: 42 })
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(numberResult.current).toBe(42)
    })

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: { foo: "bar" } },
      }
    )

    objectRerender({ value: { foo: "baz" } })
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(objectResult.current).toEqual({ foo: "baz" })
    })
  })
})
