"use client"

/**
 * Sidebar - Collapsible Navigation Component
 * Story 10.3: Collapsible Sidebar Navigation
 *
 * Features:
 * - Toggles between 256px (expanded) and 64px (collapsed)
 * - Smooth animations with Framer Motion
 * - Tooltips in collapsed state
 * - Keyboard shortcut (Cmd/Ctrl + B)
 * - localStorage persistence
 * - Active route highlighting
 */

import React, { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  FolderKanban,
  Briefcase,
  Users,
  Building2,
  Grid2x2,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  requiresAuth?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban, requiresAuth: true },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase, requiresAuth: true },
  { href: "/contacts", label: "Contacts", icon: Users, requiresAuth: true },
  { href: "/vendors/dashboard", label: "Vendors", icon: Building2, requiresAuth: true },
  { href: "/categories", label: "Categories", icon: Grid2x2, requiresAuth: true },
]

// Animation variants (AC: 7 - 200ms ease-in-out)
const sidebarVariants = {
  expanded: {
    width: 256,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  collapsed: {
    width: 64,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

const textVariants = {
  expanded: {
    opacity: 1,
    width: "auto",
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  collapsed: {
    opacity: 0,
    width: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { isCollapsed, toggle } = useCollapsedSidebar()

  // Keyboard shortcut (AC: 3 - Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [toggle])

  // Filter navigation items based on auth status (AC: 4)
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.requiresAuth || user)

  // Check if route is active (AC: 8)
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <TooltipProvider delayDuration={500}>
      {/* AC: 1 - Toggles between 256px and 64px */}
      <motion.aside
        role="complementary"
        aria-label="Main navigation sidebar"
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-card border-r border-border hidden md:flex"
        data-collapsed={isCollapsed}
      >
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          {!isCollapsed ? (
            <motion.div
              initial={false}
              animate="expanded"
              variants={textVariants}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Building2 className="w-6 h-6 shrink-0 text-primary" />
              <span className="font-semibold text-sm whitespace-nowrap">Real Estate Tracker</span>
            </motion.div>
          ) : (
            <Building2 className="w-6 h-6 text-primary mx-auto" />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      // AC: 8 - Active state indication
                      active && "bg-accent text-accent-foreground border-l-4 border-primary",
                      !active && "text-muted-foreground",
                      isCollapsed && "justify-center"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {/* AC: 5 - Icons remain visible */}
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />

                    {/* AC: 4,5 - Text hidden in collapsed state */}
                    {!isCollapsed && (
                      <motion.span
                        initial={false}
                        animate="expanded"
                        variants={textVariants}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                </TooltipTrigger>

                {/* AC: 5 - Tooltips in collapsed state */}
                {isCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* AC: 2 - Toggle button at bottom */}
        <div className="p-2 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggle}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-center hover:bg-accent",
                  !isCollapsed && "justify-start"
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                <ChevronLeft
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isCollapsed && "rotate-180"
                  )}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <motion.span
                    initial={false}
                    animate="expanded"
                    variants={textVariants}
                    className="ml-2 text-sm overflow-hidden whitespace-nowrap"
                  >
                    Collapse
                  </motion.span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {isCollapsed ? "Expand" : "Collapse"} (
              {typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
                ? "⌘B"
                : "Ctrl+B"}
              )
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
