"use client"

/**
 * Sidebar - Collapsible Navigation Component with User Profile & Tools
 * Story 10.3: Collapsible Sidebar Navigation
 * Story 10.11: Enhanced Sidebar - User Profile & Tools Navigation
 *
 * Features:
 * - Toggles between 256px (expanded) and 64px (collapsed)
 * - Hamburger menu toggle in header (replaces bottom toggle)
 * - User profile section with avatar, name, role, and dropdown menu
 * - Secondary "Tools" navigation (Notifications, Settings, Help)
 * - Smooth animations with Framer Motion (200ms)
 * - Tooltips in collapsed state
 * - Keyboard shortcut (Cmd/Ctrl + B)
 * - localStorage persistence
 * - Active route highlighting
 *
 * @param notificationCount - Optional notification count for badge (default: 0)
 *
 * @example
 * <Sidebar notificationCount={3} />
 */

import React, { useEffect } from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  FolderKanban,
  Briefcase,
  Users,
  Building2,
  Grid2x2,
  Menu,
  Bell,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react"
import { useCollapsedSidebar } from "@/hooks/useCollapsedSidebar"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface NavItem {
  href: Route<string>
  label: string
  icon: LucideIcon
  requiresAuth?: boolean
  badge?: boolean // For showing notification badge
}

// Main navigation items
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban, requiresAuth: true },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase, requiresAuth: true },
  { href: "/contacts", label: "Contacts", icon: Users, requiresAuth: true },
  { href: "/vendors/dashboard", label: "Vendors", icon: Building2, requiresAuth: true },
  { href: "/categories", label: "Categories", icon: Grid2x2, requiresAuth: true },
]

// Tools navigation items (Story 10.11)
const TOOLS_NAV_ITEMS: NavItem[] = [
  {
    href: "/notifications" as Route<string>,
    label: "Notifications",
    icon: Bell,
    requiresAuth: true,
    badge: true,
  },
  { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
  { href: "/help" as Route<string>, label: "Help", icon: HelpCircle },
]

// Animation variants (200ms ease-in-out standard)
const sidebarVariants = {
  expanded: {
    width: 256,
  },
  collapsed: {
    width: 64,
  },
}

const textVariants = {
  expanded: {
    opacity: 1,
    width: "auto",
  },
  collapsed: {
    opacity: 0,
    width: 0,
  },
}

export interface SidebarProps {
  /** Notification count for badge indicator */
  notificationCount?: number
}

/**
 * Generate user initials from full name
 * @param name - User's full name
 * @returns Initials (max 2 characters)
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ notificationCount = 0 }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed, toggle } = useCollapsedSidebar()

  // Keyboard shortcut (Cmd/Ctrl + B)
  useEffect(() => {
    if (!user) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [toggle, user])

  // Filter navigation items based on auth status
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.requiresAuth || user)
  const visibleToolsItems = TOOLS_NAV_ITEMS.filter((item) => !item.requiresAuth || user)

  // Check if route is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname === href || pathname?.startsWith(href + "/")
  }

  // Handle dropdown menu actions
  const handleProfileClick = () => {
    router.push("/profile" as Route<string>)
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  // Hide sidebar for unauthenticated users (after all hooks)
  if (!user) {
    return null
  }

  return (
    <TooltipProvider delayDuration={500}>
      {/* Sidebar container - maintains z-40 (above TopHeaderBar z-30) */}
      <motion.aside
        role="complementary"
        aria-label="Main navigation sidebar"
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-card border-r border-border hidden md:flex"
        data-collapsed={isCollapsed}
      >
        {/* Header with Hamburger Toggle (Story 10.11 - AC: 1) */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
            {!isCollapsed && (
              <motion.span
                initial={false}
                animate="expanded"
                variants={textVariants}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="font-semibold text-sm whitespace-nowrap overflow-hidden"
              >
                Real Estate Tracker
              </motion.span>
            )}
          </div>

          {/* Hamburger toggle button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggle}
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!isCollapsed}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
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

        {/* User Profile Section (Story 10.11 - AC: 2,3,7,8) */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full p-4 border-b border-border",
                    "flex items-center gap-3",
                    "hover:bg-accent transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCollapsed && "justify-center"
                  )}
                  aria-label={user ? `${user.name} profile menu` : "User profile menu"}
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={undefined} alt={user?.name ?? "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>

                  {!isCollapsed && (
                    <motion.div
                      initial={false}
                      animate="expanded"
                      variants={textVariants}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="text-left overflow-hidden"
                    >
                      <div className="font-medium text-sm truncate">
                        {user?.name ?? "Guest User"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(user as any)?.role ?? "Member"}
                      </div>
                    </motion.div>
                  )}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>

            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                {user?.name ?? "Guest User"}
              </TooltipContent>
            )}
          </Tooltip>

          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main Navigation */}
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
                      active && "bg-accent text-accent-foreground border-l-4 border-primary",
                      !active && "text-muted-foreground",
                      isCollapsed && "justify-center"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />

                    {!isCollapsed && (
                      <motion.span
                        initial={false}
                        animate="expanded"
                        variants={textVariants}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                </TooltipTrigger>

                {isCollapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Tools Navigation Section (Story 10.11 - AC: 4,5,9) */}
        <div className="border-t border-border">
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate="expanded"
              variants={textVariants}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="px-5 py-2 overflow-hidden"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tools
              </span>
            </motion.div>
          )}

          <nav className="px-2 py-2 space-y-1">
            {visibleToolsItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              const showBadge = item.badge && notificationCount > 0

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative",
                        "hover:bg-accent hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground border-l-4 border-primary",
                        !active && "text-muted-foreground",
                        isCollapsed && "justify-center"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />

                      {!isCollapsed && (
                        <>
                          <motion.span
                            initial={false}
                            animate="expanded"
                            variants={textVariants}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                          >
                            {item.label}
                          </motion.span>

                          {/* Notification badge in expanded state */}
                          {showBadge && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Badge variant="destructive" className="ml-auto">
                                {notificationCount}
                              </Badge>
                            </motion.div>
                          )}
                        </>
                      )}

                      {/* Notification badge in collapsed state */}
                      {isCollapsed && showBadge && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </TooltipTrigger>

                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                      {showBadge && ` (${notificationCount})`}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
