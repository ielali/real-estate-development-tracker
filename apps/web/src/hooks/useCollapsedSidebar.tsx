/**
 * useCollapsedSidebar Hook & Context Provider
 * Story 10.3: Collapsible Sidebar Navigation
 *
 * Manages sidebar collapse state with localStorage persistence
 * Uses React Context to share state across all components
 */

"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

const STORAGE_KEY = "sidebar-collapsed"

export interface UseCollapsedSidebarReturn {
  isCollapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

// Create Context
const CollapsedSidebarContext = createContext<UseCollapsedSidebarReturn | null>(null)

/**
 * Provider component that wraps the app and provides shared sidebar state
 */
export function CollapsedSidebarProvider({ children }: { children: ReactNode }) {
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

  const value = { isCollapsed, toggle, setCollapsed }

  return (
    <CollapsedSidebarContext.Provider value={value}>{children}</CollapsedSidebarContext.Provider>
  )
}

/**
 * Hook for accessing sidebar collapsed state
 *
 * Features:
 * - SSR-safe localStorage access
 * - Automatic state persistence
 * - Manual state control
 * - Shared state across all components
 *
 * @returns Sidebar collapse state and control functions
 */
export function useCollapsedSidebar(): UseCollapsedSidebarReturn {
  const context = useContext(CollapsedSidebarContext)

  if (!context) {
    throw new Error("useCollapsedSidebar must be used within CollapsedSidebarProvider")
  }

  return context
}
