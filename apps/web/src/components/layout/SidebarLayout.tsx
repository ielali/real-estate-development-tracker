"use client"

/**
 * SidebarLayout - Layout wrapper with collapsible sidebar
 * Story 10.3: Collapsible Sidebar Navigation
 *
 * Provides main layout structure with:
 * - Collapsible sidebar
 * - Dynamic content area that adjusts to sidebar state
 * - Smooth transitions without layout jumps
 */

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { Navbar } from "./Navbar"
import { useViewport } from "@/hooks/useViewport"

interface SidebarLayoutProps {
  children: ReactNode
  showNavbar?: boolean // Option to keep existing navbar for backwards compatibility
}

// Content area animation variants (AC: 9 - smooth adjustment)
const contentVariants = {
  expanded: {
    marginLeft: 256, // 256px when sidebar is expanded
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  collapsed: {
    marginLeft: 64, // 64px when sidebar is collapsed (AC: 10 - 192px savings)
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

export function SidebarLayout({ children, showNavbar = false }: SidebarLayoutProps) {
  const { isCollapsed } = useCollapsedSidebar()
  const { isMobile } = useViewport()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Component - Hidden on mobile (Story 10.5) */}
      <Sidebar />

      {/* Main Content Area */}
      {/* AC: 9 - Content area adjusts smoothly without jumps */}
      {/* AC: 10 - Achieves 192px space savings (256px - 64px = 192px) */}
      {/* Story 10.5: Add padding-bottom on mobile for bottom tab bar */}
      <motion.div
        initial={false}
        animate={isMobile ? false : isCollapsed ? "collapsed" : "expanded"}
        variants={contentVariants}
        className="min-h-screen"
        style={isMobile ? { marginLeft: 0 } : undefined}
      >
        {/* Optional: Keep existing navbar for backwards compatibility */}
        {showNavbar && <Navbar />}

        {/* Page Content with mobile padding for bottom tab bar */}
        <main className={isMobile ? "w-full pb-20" : "w-full"}>{children}</main>
      </motion.div>
    </div>
  )
}
