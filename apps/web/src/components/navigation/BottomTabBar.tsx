/**
 * BottomTabBar Component
 * Story 10.5: Bottom Tab Bar Navigation
 *
 * Mobile-only bottom navigation with floating action button
 */

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, FolderKanban, Plus, DollarSign, FileText } from "lucide-react"

export interface TabItem {
  icon: React.ElementType
  label: string
  href: string
  /**
   * If true, renders as a floating action button (FAB)
   */
  isFloatingAction?: boolean
  /**
   * Badge count or boolean indicator
   */
  badge?: number | boolean
}

const bottomTabs: TabItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Plus, label: "Add", href: "/projects/new", isFloatingAction: true },
  { icon: DollarSign, label: "Costs", href: "/costs" },
  { icon: FileText, label: "Files", href: "/documents" },
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
        // Layout
        "flex items-center justify-around",
        // Only show on mobile (Story requirement)
        "md:hidden"
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {bottomTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)

        // Floating Action Button (FAB) - AC #3
        if (tab.isFloatingAction) {
          return (
            <Link
              key={tab.label}
              href={tab.href as never}
              className="relative -top-4"
              onClick={handleTabClick}
              aria-label={tab.label}
            >
              <div
                className={cn(
                  // Size and shape
                  "w-14 h-14 rounded-full",
                  // Colors
                  "bg-primary text-primary-foreground",
                  // Layout
                  "flex items-center justify-center",
                  // Elevation (shadow effect)
                  "shadow-lg hover:shadow-xl",
                  // Transitions
                  "transition-all duration-200",
                  // Press animation
                  "active:scale-95"
                )}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
            </Link>
          )
        }

        // Regular tab item - AC #2, #4
        return (
          <Link
            key={tab.label}
            href={tab.href as never}
            className={cn(
              // Layout
              "flex flex-col items-center justify-center",
              "flex-1 h-full relative",
              // Touch target sizing (minimum 44px) - AC #2
              "min-h-[44px]",
              // Transitions
              "transition-colors duration-200",
              // Active state colors (AC #4)
              isActive ? "text-primary" : "text-muted-foreground"
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
