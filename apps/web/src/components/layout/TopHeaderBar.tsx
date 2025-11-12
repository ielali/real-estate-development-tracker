"use client"

/**
 * TopHeaderBar - Global Header Bar with Search and Quick Actions
 * Story 10.10: Top Header Bar - Global Search & Actions
 *
 * Features:
 * - Global search bar (UI only, functionality separate)
 * - Notification button with badge indicator
 * - Context-aware primary CTA button
 * - Fixed positioning at top of main content area
 * - Responsive behavior (mobile vs desktop)
 * - Coordinates with sidebar collapse state
 * - Smooth animations with Framer Motion
 * - Full keyboard accessibility
 *
 * Positioning:
 * - Desktop: Adjusts left margin based on sidebar state (256px expanded, 64px collapsed)
 * - Mobile: Full width (no left margin)
 * - Z-index: 30 (below Sidebar z-40, above HorizontalNav z-20)
 *
 * @param notificationCount - Number of unread notifications (shows badge if > 0)
 * @param ctaLabel - Label for primary CTA button (e.g., "New Project")
 * @param ctaAction - Click handler for primary CTA button
 * @param onSearchChange - Search input change handler (UI only)
 *
 * @example
 * <TopHeaderBar
 *   notificationCount={3}
 *   ctaLabel="New Project"
 *   ctaAction={() => router.push('/projects/new')}
 *   onSearchChange={(query) => console.log(query)}
 * />
 */

import { motion } from "framer-motion"
import { Search, Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useViewport } from "@/hooks/useViewport"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { cn } from "@/lib/utils"

export interface TopHeaderBarProps {
  /** Number of unread notifications (displays badge if > 0) */
  notificationCount?: number

  /** Label for the primary CTA button */
  ctaLabel?: string

  /** Click handler for the primary CTA button */
  ctaAction?: () => void

  /** Search input change handler (UI only, actual search is separate story) */
  onSearchChange?: (query: string) => void

  /** Additional CSS classes */
  className?: string
}

// Animation variants for smooth transitions
const headerVariants = {
  expanded: {
    marginLeft: 256, // When sidebar is expanded
  },
  collapsed: {
    marginLeft: 64, // When sidebar is collapsed
  },
}

// Badge animation for notification indicator
const badgeVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
}

export function TopHeaderBar({
  notificationCount = 0,
  ctaLabel = "New Project",
  ctaAction,
  onSearchChange,
  className,
}: TopHeaderBarProps) {
  const { isMobile } = useViewport()
  const { isCollapsed } = useCollapsedSidebar()

  return (
    <motion.header
      initial={false}
      animate={isMobile ? false : isCollapsed ? "collapsed" : "expanded"}
      variants={headerVariants}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed top-0 right-0 h-16 bg-background border-b border-border z-30",
        "transition-all duration-200",
        className
      )}
      style={isMobile ? { left: 0, marginLeft: 0 } : { left: 0 }}
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Search Bar - Desktop Only */}
        {!isMobile && (
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search projects, costs, vendors..."
                className="pl-10 bg-secondary"
                onChange={(e) => onSearchChange?.(e.target.value)}
                aria-label="Global search"
              />
            </div>
          </div>
        )}

        {/* Search Button - Mobile Only */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-12 min-w-12"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative min-h-12 min-w-12"
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ""}`}
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <motion.span
                variants={badgeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"
                aria-hidden="true"
              />
            )}
          </Button>

          {/* Primary CTA - Desktop Only */}
          {!isMobile && (
            <Button onClick={ctaAction} className="gap-2" aria-label={ctaLabel}>
              <Plus className="w-4 h-4" />
              {ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
