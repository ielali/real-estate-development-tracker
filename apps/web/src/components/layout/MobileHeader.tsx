/**
 * MobileHeader Component
 * Story 10.8: Collapsible Header on Scroll
 *
 * Fixed mobile header that hides on scroll down and shows on scroll up
 * - Integrates hamburger menu button, search, and notifications
 * - Uses scroll direction detection for hide/show behavior
 * - iOS safe area support for notch/dynamic island
 * - Smooth animations with 200ms ease-in-out
 * - Disabled during modal/overlay display
 */

"use client"

import { Menu, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/components/providers/AuthProvider"

export interface MobileHeaderProps {
  /** Called when hamburger menu is clicked */
  onMenuClick?: () => void
  /** Disable scroll behavior (e.g., when modal is open) */
  disabled?: boolean
  /** Current page title (optional) */
  title?: string
}

export function MobileHeader({ onMenuClick, disabled = false, title }: MobileHeaderProps) {
  const { user } = useAuth()
  const scrollDirection = useScrollDirection({
    threshold: 50,
    disabled,
  })

  // Trigger command palette programmatically
  const handleSearchClick = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header
      className={cn(
        // Fixed positioning at top (AC #6)
        "fixed top-0 left-0 right-0",
        // Z-index - below bottom tabs (z-50) but above content
        "z-40",
        // Height
        "h-16",
        // Styling
        "bg-background border-b border-border shadow-sm",
        // iOS safe area support (AC #5)
        "pt-safe",
        // Animation (AC #7 - 200ms ease-in-out)
        "transition-transform duration-200 ease-in-out",
        // Performance optimization (AC #9)
        "will-change-transform",
        // Scroll behavior (AC #1, #2)
        scrollDirection === "down" && !disabled ? "-translate-y-full" : "translate-y-0",
        // Mobile only
        "md:hidden"
      )}
      role="banner"
      aria-label="Mobile navigation header"
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className={cn(
            // Size
            "w-10 h-10",
            // Styling
            "rounded-lg",
            "hover:bg-accent",
            "active:bg-accent/80",
            // Layout
            "flex items-center justify-center",
            // Transitions
            "transition-colors duration-200",
            // Press effect
            "active:scale-95"
          )}
          aria-label="Open navigation menu"
          aria-expanded={false}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Center: Title (optional) */}
        {title && (
          <h1 className="text-lg font-semibold truncate flex-1 mx-4 text-center">{title}</h1>
        )}

        {/* Right: Search and Notifications */}
        <div className="flex items-center gap-2">
          {/* Search Button - only show for authenticated users */}
          {user && (
            <button
              onClick={handleSearchClick}
              className={cn(
                // Size
                "w-10 h-10",
                // Styling
                "rounded-lg",
                "hover:bg-accent",
                "active:bg-accent/80",
                // Layout
                "flex items-center justify-center",
                // Transitions
                "transition-colors duration-200",
                // Press effect
                "active:scale-95"
              )}
              aria-label="Search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          )}

          {/* Notifications - only show for authenticated users */}
          {user && <NotificationBell />}
        </div>
      </div>
    </header>
  )
}

/**
 * Spacer component to prevent content from being hidden under the fixed header
 * Use this below the MobileHeader in your layout
 */
export function MobileHeaderSpacer() {
  return (
    <div
      className={cn(
        // Match header height + safe area
        "h-16",
        "pt-safe",
        // Mobile only
        "md:hidden"
      )}
      aria-hidden="true"
    />
  )
}
