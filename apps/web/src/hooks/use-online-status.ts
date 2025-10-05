"use client"

import { useEffect, useState } from "react"

/**
 * useOnlineStatus - Hook to detect online/offline status
 *
 * Monitors network connectivity using navigator.onLine API
 * and online/offline event listeners
 *
 * Returns true when online, false when offline
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus()
 *
 *   if (!isOnline) {
 *     return <div>You are offline</div>
 *   }
 *
 *   return <div>Connected</div>
 * }
 * ```
 *
 * @returns boolean - Current online status
 */
export function useOnlineStatus(): boolean {
  // Initialize with current online status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Check if we're in browser environment
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return navigator.onLine
    }
    // Default to online for SSR
    return true
  })

  useEffect(() => {
    // Handler for when connection is restored
    function handleOnline() {
      setIsOnline(true)
    }

    // Handler for when connection is lost
    function handleOffline() {
      setIsOnline(false)
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
