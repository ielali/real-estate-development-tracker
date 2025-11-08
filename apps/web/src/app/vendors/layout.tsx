"use client"

import { Navbar } from "@/components/layout/Navbar"

/**
 * Vendors Layout - Provides consistent layout for all vendor pages
 *
 * Features:
 * - Main navigation navbar
 * - Consistent page structure
 *
 * Note: Individual pages handle their own breadcrumb navigation
 */
export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
