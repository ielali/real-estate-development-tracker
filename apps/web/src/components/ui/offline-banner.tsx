"use client"

import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"

/**
 * OfflineBanner - Displays a banner when the user is offline
 *
 * Automatically shows/hides based on network connectivity status
 * Uses useOnlineStatus hook to monitor connection
 *
 * Features:
 * - Sticky positioning at top of viewport
 * - High z-index to appear above other content
 * - Accessible with role="alert" for screen readers
 * - Only renders when offline (no DOM element when online)
 *
 * @example
 * ```tsx
 * // In layout or root component:
 * <OfflineBanner />
 * <main>{children}</main>
 * ```
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // Don't render anything when online
  if (isOnline) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-amber-500 text-white px-4 py-3 shadow-md"
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">
          You are currently offline. Some features may be unavailable.
        </span>
      </div>
    </div>
  )
}
