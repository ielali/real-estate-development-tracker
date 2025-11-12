/**
 * ContentWrapper - Adjusts content margin based on sidebar and header state
 * Story 10.9: Update All Existing Pages
 * Story 10.10: Top Header Bar (added padding-top for header height)
 *
 * Wraps page content to adjust:
 * - Left margin based on sidebar state (256px expanded, 64px collapsed)
 * - Top padding for TopHeaderBar (64px fixed height)
 * - Mobile: No left margin (sidebar hidden), padding-top for header
 */

"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { useViewport } from "@/hooks/useViewport"

interface ContentWrapperProps {
  children: ReactNode
}

// Content area animation variants
const contentVariants = {
  expanded: {
    marginLeft: 256, // 256px when sidebar is expanded
  },
  collapsed: {
    marginLeft: 64, // 64px when sidebar is collapsed
  },
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  const { isCollapsed } = useCollapsedSidebar()
  const { isMobile } = useViewport()

  return (
    <motion.div
      initial={false}
      animate={isMobile ? false : isCollapsed ? "collapsed" : "expanded"}
      variants={contentVariants}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen pt-16"
      style={isMobile ? { marginLeft: 0 } : undefined}
    >
      {children}
    </motion.div>
  )
}
