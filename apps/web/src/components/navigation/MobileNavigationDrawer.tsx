/**
 * MobileNavigationDrawer Component
 * Story 10.6: Swipeable Navigation Drawer
 *
 * Complete mobile navigation drawer with:
 * - User profile header
 * - Navigation menu items
 * - Swipe gestures
 * - Focus trap
 * - Backdrop overlay
 * - Floating hamburger menu button for discoverability
 */

"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { SwipeableDrawer } from "./SwipeableDrawer"
import { DrawerHeader } from "./DrawerHeader"
import { DrawerNavigation } from "./DrawerNavigation"

export function MobileNavigationDrawer() {
  const [open, setOpen] = useState(false)

  const handleNavigate = () => {
    setOpen(false)
  }

  const handleMenuClick = () => {
    setOpen(true)
  }

  return (
    <>
      {/* Floating Hamburger Menu Button */}
      <button
        onClick={handleMenuClick}
        className={cn(
          // Positioning - top-left corner with safe area support
          "fixed top-4 left-4 z-40",
          "safe-top-4", // Respects notch/dynamic island
          // Size
          "w-12 h-12",
          // Styling
          "bg-background border border-border rounded-lg shadow-md",
          "hover:bg-accent hover:shadow-lg",
          // Layout
          "flex items-center justify-center",
          // Transitions
          "transition-all duration-200",
          // Press effect
          "active:scale-95",
          // Mobile only
          "md:hidden",
          // Hide when drawer is open
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-navigation-drawer"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Swipeable Drawer */}
      <SwipeableDrawer open={open} onOpenChange={setOpen}>
        <DrawerHeader onNavigate={handleNavigate} />
        <DrawerNavigation onNavigate={handleNavigate} />
      </SwipeableDrawer>
    </>
  )
}
