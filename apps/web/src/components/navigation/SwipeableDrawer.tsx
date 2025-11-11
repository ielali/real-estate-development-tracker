/**
 * SwipeableDrawer Component
 * Story 10.6: Swipeable Navigation Drawer
 *
 * Mobile-only drawer navigation with swipe gestures
 * - Swipe from left edge (20px hot zone) to open
 * - Swipe left on drawer to close
 * - Spring animations for smooth transitions
 * - Backdrop overlay with click-to-close
 */

"use client"

import { useEffect, useRef, useState, ReactNode } from "react"
import { useDrag } from "@use-gesture/react"
import { useSpring, animated, config } from "react-spring"
import FocusTrap from "focus-trap-react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface SwipeableDrawerProps {
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

const HOT_ZONE_WIDTH = 20 // pixels from left edge for swipe trigger (AC #1)
const DRAWER_MAX_WIDTH = 320 // max width in pixels (AC #3)
const DRAWER_MAX_WIDTH_PERCENT = 0.85 // 85% of viewport width (AC #3)

export function SwipeableDrawer({ children, open, onOpenChange }: SwipeableDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [_isDragging, setIsDragging] = useState(false)

  // Calculate drawer width (320px or 85% of screen, whichever is smaller) - AC #3
  const getDrawerWidth = () => {
    if (typeof window === "undefined") return DRAWER_MAX_WIDTH
    const viewportWidth = window.innerWidth
    return Math.min(DRAWER_MAX_WIDTH, viewportWidth * DRAWER_MAX_WIDTH_PERCENT)
  }

  const [drawerWidth, setDrawerWidth] = useState(getDrawerWidth)

  // Update drawer width on resize
  useEffect(() => {
    const handleResize = () => {
      setDrawerWidth(getDrawerWidth())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Spring animation for drawer position (AC #7)
  const [{ x }, api] = useSpring(() => ({
    x: -drawerWidth,
    config: config.default, // Smooth spring animation
  }))

  // Update spring target when open state changes
  useEffect(() => {
    api.start({ x: open ? 0 : -drawerWidth })
  }, [open, drawerWidth, api])

  // Backdrop spring animation
  const [{ opacity }, backdropApi] = useSpring(() => ({
    opacity: 0,
    config: config.default,
  }))

  useEffect(() => {
    backdropApi.start({ opacity: open ? 0.4 : 0 }) // AC #8: 40% opacity
  }, [open, backdropApi])

  // Swipe gesture handling (AC #1, #2)
  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], cancel, event }) => {
      setIsDragging(down)

      // Get current drawer position
      const currentX = x.get()

      // Only allow swipe to open from hot zone (AC #1)
      const target = event?.target as HTMLElement
      const isHotZone = target && target.getBoundingClientRect().left < HOT_ZONE_WIDTH

      // Prevent opening if not in hot zone and drawer is closed
      if (!open && !isHotZone && mx > 0) {
        cancel?.()
        return
      }

      if (down) {
        // While dragging, move drawer with finger
        const newX = Math.max(-drawerWidth, Math.min(0, currentX + mx))
        api.start({ x: newX, immediate: true })
      } else {
        // On release, determine if should open or close
        const _trigger = vx > 0.2 || Math.abs(mx) > drawerWidth / 2

        if (open) {
          // Drawer is open: close if swiping left with velocity or past midpoint
          const shouldClose = (vx < -0.2 || mx < -drawerWidth / 2) && mx < 0
          onOpenChange(!shouldClose)
        } else {
          // Drawer is closed: open if swiping right with velocity or past midpoint
          const shouldOpen = (vx > 0.2 || mx > drawerWidth / 2) && mx > 0
          onOpenChange(shouldOpen)
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      from: () => [x.get(), 0],
    }
  )

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Hot zone for swipe-to-open (AC #1) */}
      <div
        {...bind()}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40",
          "md:hidden", // Mobile only
          open && "hidden" // Hide when drawer is open
        )}
        style={{
          width: `${HOT_ZONE_WIDTH}px`,
          touchAction: "pan-y",
        }}
        aria-hidden="true"
      />

      {/* Backdrop overlay (AC #8) */}
      <animated.div
        style={{
          opacity,
          pointerEvents: open ? "auto" : "none",
        }}
        className={cn(
          "fixed inset-0 bg-black z-40",
          "md:hidden" // Mobile only
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Swipeable Drawer (AC #1, #2, #3, #7, #9) */}
      <FocusTrap
        active={open}
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: true,
          returnFocusOnDeactivate: true,
        }}
      >
        <animated.div
          ref={drawerRef}
          {...bind()}
          style={{
            x,
            touchAction: "pan-y", // Allow vertical scrolling but handle horizontal
          }}
          className={cn(
            "fixed top-0 left-0 h-full z-50",
            "bg-background shadow-lg",
            "md:hidden", // Mobile only
            "flex flex-col"
          )}
          data-drawer-width={drawerWidth}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Close button header */}
          <div className="flex justify-end p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Drawer content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </animated.div>
      </FocusTrap>
    </>
  )
}
