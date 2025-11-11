/**
 * DrawerNavigation Component
 * Story 10.6: Swipeable Navigation Drawer
 *
 * Navigation items for the swipeable drawer
 * - All desktop navigation items
 * - Maintains hierarchy and permissions
 * - Active state highlighting
 * - Icon support
 */

"use client"

import Link from "next/link"
import type { Route } from "next"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Home,
  FolderKanban,
  Briefcase,
  Users,
  Building2,
  Grid2x2,
  Settings,
  Bell,
  Shield,
  LogOut,
  type LucideIcon,
} from "lucide-react"

export interface DrawerNavigationProps {
  onNavigate?: () => void
}

interface NavSection {
  title?: string
  items: NavItem[]
}

interface NavItem {
  href: Route<string>
  label: string
  icon: LucideIcon
  requiresAuth?: boolean
  requiresAdmin?: boolean
  action?: () => void | Promise<void>
}

export function DrawerNavigation({ onNavigate }: DrawerNavigationProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check if route is active
  const isActive = (href: Route<string>) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href) ?? false
  }

  // Define navigation sections with hierarchy
  const navigationSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { href: "/", label: "Home", icon: Home },
        { href: "/projects", label: "Projects", icon: FolderKanban, requiresAuth: true },
        { href: "/portfolio", label: "Portfolio", icon: Briefcase, requiresAuth: true },
        { href: "/contacts", label: "Contacts", icon: Users, requiresAuth: true },
        { href: "/vendors/dashboard", label: "Vendors", icon: Building2, requiresAuth: true },
        { href: "/categories", label: "Categories", icon: Grid2x2, requiresAuth: true },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/settings/profile", label: "Settings", icon: Settings, requiresAuth: true },
        {
          href: "/settings/notifications",
          label: "Notifications",
          icon: Bell,
          requiresAuth: true,
        },
        {
          href: "/admin/security",
          label: "Admin Dashboard",
          icon: Shield,
          requiresAuth: true,
          requiresAdmin: true,
        },
      ],
    },
  ]

  // Filter items based on auth and role
  const getVisibleSections = () => {
    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // Check auth requirement
          if (item.requiresAuth && !user) return false

          // Check admin requirement
          if (item.requiresAdmin && user?.role !== "admin") return false

          return true
        }),
      }))
      .filter((section) => section.items.length > 0) // Remove empty sections
  }

  const visibleSections = getVisibleSections()

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      onNavigate?.()
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="py-2">
      {visibleSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-6">
          {/* Section Title */}
          {section.title && (
            <div className="px-6 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            </div>
          )}

          {/* Section Items */}
          <div className="space-y-1 px-3">
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm font-medium transition-colors",
                    "hover:bg-muted",
                    active
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Logout Button (if authenticated) */}
      {user && (
        <div className="mt-6 px-3 pt-6 border-t">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full",
              "text-sm font-medium transition-colors",
              "text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  )
}
