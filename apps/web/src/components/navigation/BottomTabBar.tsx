/**
 * BottomTabBar Component
 * Story 10.5: Bottom Tab Bar Navigation
 * Story 10.7: Floating Action Button with Speed Dial
 * Story 10.13: Active states updated to use primary-light color
 *
 * Mobile-only bottom navigation with floating action button and speed dial menu
 */

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, FolderKanban, Users, User } from "lucide-react"
import { FloatingActionButton } from "./FloatingActionButton"

export interface TabItem {
  icon: React.ElementType
  label: string
  href: string
  /**
   * Badge count or boolean indicator
   */
  badge?: number | boolean
}

const bottomTabs: TabItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Users, label: "Vendors", href: "/vendors/dashboard" },
  { icon: User, label: "Profile", href: "/settings/profile" },
]

export function BottomTabBar() {
  const pathname = usePathname()

  const handleTabClick = () => {
    // Haptic feedback for iOS (Story AC #9)
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        "fixed bottom-0 left-0 right-0 z-50",
        // Height + safe area support (AC #1, #7)
        "h-14",
        "pb-[env(safe-area-inset-bottom)]",
        // Styling
        "bg-background border-t border-border",
        // Layout - grid for 4 tabs + FAB in center
        "grid grid-cols-5 items-center",
        // Only show on mobile (Story requirement)
        "md:hidden"
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* First two tabs */}
      {bottomTabs.slice(0, 2).map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

        return (
          <Link
            key={tab.label}
            href={tab.href as never}
            className={cn(
              // Layout
              "flex flex-col items-center justify-center",
              "h-full relative",
              // Touch target sizing (minimum 44px) - AC #2
              "min-h-[44px]",
              // Transitions
              "transition-colors duration-200",
              // Active state colors (AC #4, Story 10.13)
              isActive ? "text-primary bg-primary-light" : "text-muted-foreground"
            )}
            onClick={handleTabClick}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              {/* Icon with filled/outlined variants (AC #4) */}
              <Icon
                className="w-6 h-6"
                fill={isActive ? "currentColor" : "none"}
                aria-hidden="true"
              />
              {/* Badge notification (AC #5) */}
              {tab.badge && (
                <span
                  className={cn(
                    // Positioning
                    "absolute -top-1 -right-1",
                    // Size
                    "min-w-[18px] h-[18px]",
                    // Colors (red for alerts)
                    "bg-red-500 text-white",
                    // Typography
                    "text-xs font-medium",
                    // Shape
                    "rounded-full",
                    // Layout
                    "flex items-center justify-center",
                    "px-1"
                  )}
                  aria-label={`${typeof tab.badge === "number" ? tab.badge : ""} notifications`}
                >
                  {typeof tab.badge === "number" ? tab.badge : ""}
                </span>
              )}
            </div>
            {/* Label */}
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </Link>
        )
      })}

      {/* Floating Action Button (FAB) - Center - Story 10.7 */}
      <div className="flex items-center justify-center">
        <FloatingActionButton onTap={handleTabClick} />
      </div>

      {/* Last two tabs */}
      {bottomTabs.slice(2).map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

        return (
          <Link
            key={tab.label}
            href={tab.href as never}
            className={cn(
              // Layout
              "flex flex-col items-center justify-center",
              "h-full relative",
              // Touch target sizing (minimum 44px) - AC #2
              "min-h-[44px]",
              // Transitions
              "transition-colors duration-200",
              // Active state colors (AC #4, Story 10.13)
              isActive ? "text-primary bg-primary-light" : "text-muted-foreground"
            )}
            onClick={handleTabClick}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              {/* Icon with filled/outlined variants (AC #4) */}
              <Icon
                className="w-6 h-6"
                fill={isActive ? "currentColor" : "none"}
                aria-hidden="true"
              />
              {/* Badge notification (AC #5) */}
              {tab.badge && (
                <span
                  className={cn(
                    // Positioning
                    "absolute -top-1 -right-1",
                    // Size
                    "min-w-[18px] h-[18px]",
                    // Colors (red for alerts)
                    "bg-red-500 text-white",
                    // Typography
                    "text-xs font-medium",
                    // Shape
                    "rounded-full",
                    // Layout
                    "flex items-center justify-center",
                    "px-1"
                  )}
                  aria-label={`${typeof tab.badge === "number" ? tab.badge : ""} notifications`}
                >
                  {typeof tab.badge === "number" ? tab.badge : ""}
                </span>
              )}
            </div>
            {/* Label */}
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
