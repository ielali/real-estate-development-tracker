/**
 * useCollapsedSidebar Hook Tests
 * Story 10.3: Collapsible Sidebar Navigation
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCollapsedSidebar } from "../useCollapsedSidebar"

describe("useCollapsedSidebar", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  test("initializes with collapsed = false when no stored value", () => {
    const { result } = renderHook(() => useCollapsedSidebar())

    expect(result.current.isCollapsed).toBe(false)
  })

  test("initializes with stored value from localStorage", () => {
    localStorage.setItem("sidebar-collapsed", "true")

    const { result } = renderHook(() => useCollapsedSidebar())

    expect(result.current.isCollapsed).toBe(true)
  })

  test("toggle function changes state", () => {
    const { result } = renderHook(() => useCollapsedSidebar())

    expect(result.current.isCollapsed).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isCollapsed).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isCollapsed).toBe(false)
  })

  test("persists state to localStorage on toggle", () => {
    const { result } = renderHook(() => useCollapsedSidebar())

    act(() => {
      result.current.toggle()
    })

    expect(localStorage.getItem("sidebar-collapsed")).toBe("true")

    act(() => {
      result.current.toggle()
    })

    expect(localStorage.getItem("sidebar-collapsed")).toBe("false")
  })

  test("setCollapsed function sets state directly", () => {
    const { result } = renderHook(() => useCollapsedSidebar())

    act(() => {
      result.current.setCollapsed(true)
    })

    expect(result.current.isCollapsed).toBe(true)
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true")

    act(() => {
      result.current.setCollapsed(false)
    })

    expect(result.current.isCollapsed).toBe(false)
    expect(localStorage.getItem("sidebar-collapsed")).toBe("false")
  })

  test("multiple toggles work correctly", () => {
    const { result } = renderHook(() => useCollapsedSidebar())

    act(() => {
      result.current.toggle()
      result.current.toggle()
      result.current.toggle()
    })

    expect(result.current.isCollapsed).toBe(true)
  })

  test("returns all expected interface methods", () => {
    // Verify the hook returns the correct interface
    // SSR safety is guaranteed by the typeof window check in the hook implementation
    const { result } = renderHook(() => useCollapsedSidebar())

    expect(result.current).toHaveProperty("isCollapsed")
    expect(result.current).toHaveProperty("toggle")
    expect(result.current).toHaveProperty("setCollapsed")
    expect(typeof result.current.toggle).toBe("function")
    expect(typeof result.current.setCollapsed).toBe("function")
    expect(typeof result.current.isCollapsed).toBe("boolean")
  })
})
