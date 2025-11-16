/**
 * ContentWrapper - Adjusts content margin based on sidebar and header state
 * Story 10.9: Update All Existing Pages
 * Story 10.10: Top Header Bar (added padding-top for header height)
 * Story 10.12: Layout Integration (verified two-tier header compatibility)
 *
 * Wraps page content to adjust:
 * - Left margin based on sidebar state (256px expanded, 64px collapsed)
 * - Top padding for TopHeaderBar (64px fixed height)
 * - Mobile: No left margin (sidebar hidden), padding-top for header
 * - Coordinates animations with Sidebar collapse/expand (200ms)
 */

"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { useViewport } from "@/hooks/useViewport"
import { useAuth } from "@/components/providers/AuthProvider"

interface ContentWrapperProps {
  children: ReactNode
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  const { isCollapsed } = useCollapsedSidebar()
  const { isMobile } = useViewport()
  const { user } = useAuth()

  // Calculate the margin-left value
  // For authenticated desktop: use sidebar state, for mobile/unauthenticated: 0
  const marginLeft = !isMobile && user ? (isCollapsed ? 64 : 256) : 0

  return (
    <motion.div
      animate={{ marginLeft }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={user ? "min-h-screen pt-16" : "min-h-screen"}
    >
      {children}
    </motion.div>
  )
}
