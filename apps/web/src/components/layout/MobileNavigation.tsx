/**
 * MobileNavigation Component
 * Story 10.8: Collapsible Header on Scroll
 *
 * Wrapper component that manages state between MobileHeader and MobileNavigationDrawer
 * - Coordinates header menu button with drawer state
 * - Disables scroll behavior when drawer/modal is open
 */

"use client"

import { useState } from "react"
import { MobileHeader } from "./MobileHeader"
import { SwipeableDrawer } from "@/components/navigation/SwipeableDrawer"
import { DrawerHeader } from "@/components/navigation/DrawerHeader"
import { DrawerNavigation } from "@/components/navigation/DrawerNavigation"

export function MobileNavigation() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleMenuClick = () => {
    setDrawerOpen(true)
  }

  const handleNavigate = () => {
    setDrawerOpen(false)
  }

  return (
    <>
      {/* Mobile Header - disables scroll behavior when drawer is open (AC #6) */}
      <MobileHeader onMenuClick={handleMenuClick} disabled={drawerOpen} />

      {/* Swipeable Navigation Drawer */}
      <SwipeableDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerHeader onNavigate={handleNavigate} />
        <DrawerNavigation onNavigate={handleNavigate} />
      </SwipeableDrawer>
    </>
  )
}
