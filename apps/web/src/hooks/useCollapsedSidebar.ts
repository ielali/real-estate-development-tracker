/**
 * useCollapsedSidebar Hook
 * Story 10.3: Collapsible Sidebar Navigation
 *
 * Manages sidebar collapse state with localStorage persistence
 */

import { useEffect, useState } from "react"

const STORAGE_KEY = "sidebar-collapsed"

export interface UseCollapsedSidebarReturn {
  isCollapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

/**
 * Hook for managing sidebar collapsed state
 *
 * Features:
 * - SSR-safe localStorage access
 * - Automatic state persistence
 * - Manual state control
 *
 * @returns Sidebar collapse state and control functions
 */
export function useCollapsedSidebar(): UseCollapsedSidebarReturn {
  // Initialize state from localStorage (SSR-safe)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "true"
  })

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed))
    }
  }, [isCollapsed])

  // Toggle function
  const toggle = () => setIsCollapsed((prev) => !prev)

  // Manual setter
  const setCollapsed = (collapsed: boolean) => setIsCollapsed(collapsed)

  return { isCollapsed, toggle, setCollapsed }
}
