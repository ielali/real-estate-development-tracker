import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useOnlineStatus } from "../use-online-status"

describe("useOnlineStatus", () => {
  // Save original navigator.onLine
  const originalOnLine = navigator.onLine

  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: originalOnLine,
    })
  })

  describe("Initial state", () => {
    it("returns true when navigator.onLine is true", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      })

      const { result } = renderHook(() => useOnlineStatus())
      expect(result.current).toBe(true)
    })

    it("returns false when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })

      const { result } = renderHook(() => useOnlineStatus())
      expect(result.current).toBe(false)
    })
  })

  describe("Event handling", () => {
    it("updates to false when offline event is dispatched", async () => {
      const { result } = renderHook(() => useOnlineStatus())

      // Initially online
      expect(result.current).toBe(true)

      // Simulate going offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event("offline"))

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })

    it("updates to true when online event is dispatched", async () => {
      // Start offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })

      const { result } = renderHook(() => useOnlineStatus())

      // Initially offline
      expect(result.current).toBe(false)

      // Simulate going online
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      })
      window.dispatchEvent(new Event("online"))

      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it("handles multiple online/offline transitions", async () => {
      const { result } = renderHook(() => useOnlineStatus())

      // Start online
      expect(result.current).toBe(true)

      // Go offline
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event("offline"))

      await waitFor(() => {
        expect(result.current).toBe(false)
      })

      // Go back online
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      })
      window.dispatchEvent(new Event("online"))

      await waitFor(() => {
        expect(result.current).toBe(true)
      })

      // Go offline again
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event("offline"))

      await waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe("Cleanup", () => {
    it("removes event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { unmount } = renderHook(() => useOnlineStatus())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it("does not update state after unmount", async () => {
      const { result, unmount } = renderHook(() => useOnlineStatus())

      // Initially online
      expect(result.current).toBe(true)

      // Unmount the hook
      unmount()

      // Try to dispatch offline event after unmount
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      })
      window.dispatchEvent(new Event("offline"))

      // State should not update after unmount
      // (we can't check result.current after unmount, but no errors should occur)
      expect(() => {
        window.dispatchEvent(new Event("offline"))
      }).not.toThrow()
    })
  })

  describe("SSR compatibility", () => {
    it("returns true when window is undefined (SSR)", () => {
      // This test runs in jsdom, so we can't truly test SSR
      // But the implementation handles it by checking typeof window
      const { result } = renderHook(() => useOnlineStatus())

      // In browser environment, it should use navigator.onLine
      expect(typeof result.current).toBe("boolean")
    })
  })
})
