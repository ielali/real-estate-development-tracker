/**
 * useScrollDirection Hook
 * Story 10.8: Collapsible Header on Scroll
 *
 * Detects scroll direction and provides state for hiding/showing header
 * - Tracks scroll direction (up/down)
 * - Configurable threshold before hiding
 * - Can be disabled for modals/overlays
 * - Uses requestAnimationFrame for 60fps performance
 * - Passive event listeners for better scroll performance
 */

import { useState, useEffect, useRef } from "react"

export interface UseScrollDirectionOptions {
  /**
   * Threshold in pixels before hiding header (default: 50)
   */
  threshold?: number
  /**
   * Disable scroll detection (useful for modals)
   */
  disabled?: boolean
}

export type ScrollDirection = "up" | "down"

/**
 * Hook to detect scroll direction for collapsible header behavior
 *
 * @param options Configuration options
 * @returns Current scroll direction ('up' | 'down')
 *
 * @example
 * ```tsx
 * const scrollDirection = useScrollDirection({ threshold: 50, disabled: false })
 *
 * <header className={scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}>
 *   // header content
 * </header>
 * ```
 */
export function useScrollDirection(options: UseScrollDirectionOptions = {}): ScrollDirection {
  const { threshold = 50, disabled = false } = options
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>("up")
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    // Don't add listener if disabled
    if (disabled) {
      // Reset to 'up' when disabled so header shows
      setScrollDirection("up")
      return
    }

    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      // Always show header at top of page (AC #3)
      if (scrollY <= 0) {
        setScrollDirection("up")
      }
      // Hide header when scrolling down past threshold (AC #1)
      else if (scrollY > lastScrollY.current && scrollY > threshold) {
        setScrollDirection("down")
      }
      // Show header immediately when scrolling up (AC #2)
      else if (scrollY < lastScrollY.current) {
        setScrollDirection("up")
      }

      lastScrollY.current = scrollY
      ticking.current = false
    }

    const handleScroll = () => {
      if (!ticking.current) {
        // Use requestAnimationFrame for smooth 60fps updates (AC #9)
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }

    // Use passive listener for better scroll performance (AC #9)
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [threshold, disabled])

  return scrollDirection
}
