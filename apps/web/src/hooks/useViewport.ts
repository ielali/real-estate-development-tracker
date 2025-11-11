/**
 * useViewport Hook
 * Story 10.5: Bottom Tab Bar Navigation
 *
 * Detects mobile viewport for responsive navigation
 */

import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

export interface UseViewportReturn {
  isMobile: boolean
  width: number
  height: number
}

/**
 * Hook for detecting viewport size and mobile state
 *
 * Features:
 * - SSR-safe window access
 * - Responsive to window resize events
 * - Debounced resize handling for performance
 * - Mobile detection based on 768px breakpoint
 *
 * @returns Viewport state including mobile detection and dimensions
 */
export function useViewport(): UseViewportReturn {
  // Initialize state (SSR-safe)
  const [viewport, setViewport] = useState<UseViewportReturn>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        width: 0,
        height: 0,
      }
    }
    return {
      isMobile: window.innerWidth < MOBILE_BREAKPOINT,
      width: window.innerWidth,
      height: window.innerHeight,
    }
  })

  useEffect(() => {
    // Guard against SSR
    if (typeof window === "undefined") return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setViewport({
          isMobile: window.innerWidth < MOBILE_BREAKPOINT,
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 150)
    }

    // Set initial values on mount
    handleResize()

    // Listen for resize events
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return viewport
}
