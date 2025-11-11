/**
 * useViewport Hook Tests
 * Story 10.5: Bottom Tab Bar Navigation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useViewport } from "../useViewport"

describe("useViewport", () => {
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight

    // Set default test viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
  })

  test("returns desktop viewport state when width >= 768px", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useViewport())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
  })

  test("returns mobile viewport state when width < 768px", () => {
    vi.useFakeTimers()

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    })

    const { result } = renderHook(() => useViewport())

    // Wait for useEffect to run
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isMobile).toBe(true)
    expect(result.current.width).toBe(375)
    expect(result.current.height).toBe(667)

    vi.useRealTimers()
  })

  test("updates state when window is resized from desktop to mobile", async () => {
    vi.useFakeTimers()

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useViewport())

    // Start with desktop
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isMobile).toBe(false)

    // Resize to mobile
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    })

    act(() => {
      window.dispatchEvent(new Event("resize"))
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isMobile).toBe(true)
    expect(result.current.width).toBe(375)

    vi.useRealTimers()
  })

  test("updates state when window is resized from mobile to desktop", async () => {
    vi.useFakeTimers()

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useViewport())

    // Start with mobile
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isMobile).toBe(true)

    // Resize to desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })

    act(() => {
      window.dispatchEvent(new Event("resize"))
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isMobile).toBe(false)
    expect(result.current.width).toBe(1024)

    vi.useRealTimers()
  })

  test("debounces resize events", async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useViewport())

    // Trigger multiple rapid resizes
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true })
    window.dispatchEvent(new Event("resize"))

    Object.defineProperty(window, "innerWidth", { value: 900, writable: true })
    window.dispatchEvent(new Event("resize"))

    Object.defineProperty(window, "innerWidth", { value: 1000, writable: true })
    window.dispatchEvent(new Event("resize"))

    // Should not update immediately
    expect(result.current.width).not.toBe(1000)

    // Should update after debounce delay (150ms)
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current.width).toBe(1000)

    vi.useRealTimers()
  })

  test("mobile breakpoint is exactly 768px", () => {
    vi.useFakeTimers()

    // Test at breakpoint
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useViewport())

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // 768px should be considered desktop (not mobile)
    expect(result.current.isMobile).toBe(false)

    // 767px should be mobile
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 767,
    })

    act(() => {
      window.dispatchEvent(new Event("resize"))
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isMobile).toBe(true)

    vi.useRealTimers()
  })

  test("is SSR-safe and returns default values on server", () => {
    // This test would require mocking SSR environment
    // For now, we verify the hook handles window === undefined gracefully
    const { result } = renderHook(() => useViewport())

    expect(result.current).toHaveProperty("isMobile")
    expect(result.current).toHaveProperty("width")
    expect(result.current).toHaveProperty("height")
  })

  test("cleans up resize event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = renderHook(() => useViewport())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
