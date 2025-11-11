/**
 * HorizontalNav Component
 * Story 10.4: Horizontal Top Navigation for Subsections
 *
 * Provides horizontal navigation for project subsections with:
 * - Icon + text labels
 * - Active state with 2px bottom border
 * - Sticky positioning
 * - Smooth 200ms transitions
 * - Mobile responsive with horizontal scroll
 */

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Route } from "next"
import { cn } from "@/lib/utils"
import { Home, DollarSign, Calendar, FileText, Users, Settings as SettingsIcon } from "lucide-react"

export interface NavItem {
  label: string
  icon: React.ElementType
  href: Route<string>
  /**
   * When true, this nav item is only shown to non-partner users
   */
  adminOnly?: boolean
}

interface HorizontalNavProps {
  projectId: string
  /**
   * When true, shows simplified navigation for partners
   */
  isPartner?: boolean
}

/**
 * Horizontal navigation component for project subsections
 *
 * Features:
 * - URL-based routing with Next.js Link
 * - Active state indication with 2px bottom border
 * - Sticky positioning at top (z-10)
 * - Icons paired with text labels
 * - Responsive with horizontal scroll on mobile
 * - 200ms smooth transitions
 *
 * @param projectId - The ID of the current project
 * @param isPartner - Whether the current user is a partner (affects visible nav items)
 */
export function HorizontalNav({ projectId, isPartner = false }: HorizontalNavProps) {
  const pathname = usePathname()

  // Define navigation items
  const navItems: NavItem[] = [
    { label: "Overview", icon: Home, href: `/projects/${projectId}` as Route<string> },
    { label: "Costs", icon: DollarSign, href: `/projects/${projectId}/costs` as Route<string> },
    { label: "Timeline", icon: Calendar, href: `/projects/${projectId}/events` as Route<string> },
    {
      label: "Documents",
      icon: FileText,
      href: `/projects/${projectId}/documents` as Route<string>,
    },
    {
      label: "Partners",
      icon: Users,
      href: `/projects/${projectId}/partners` as Route<string>,
      adminOnly: true,
    },
    {
      label: "Settings",
      icon: SettingsIcon,
      href: `/projects/${projectId}/settings` as Route<string>,
      adminOnly: true,
    },
  ]

  // Filter nav items based on user role
  const visibleItems = navItems.filter((item) => !item.adminOnly || !isPartner)

  return (
    <nav
      className="sticky top-0 z-10 bg-background border-b"
      role="navigation"
      aria-label="Project navigation"
    >
      <div className="flex items-center space-x-1 px-4 overflow-x-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon
          // Check if current path matches this nav item
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "border-b-2 transition-all duration-200",
                "hover:text-foreground hover:bg-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
