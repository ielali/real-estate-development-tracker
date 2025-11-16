/**
 * Project Detail Layout
 * Story 10.4: Horizontal Top Navigation for Subsections
 * Story 10.12: Layout Integration - Two-Tier Header System
 *
 * Wraps all project detail pages with:
 * - Horizontal navigation for subsections (sticky below TopHeaderBar)
 * - Responsive content area
 * - Height adjusted for two-tier header (TopHeaderBar 64px + HorizontalNav 64px = 128px)
 *
 * Note: Global navigation (Sidebar, BottomTabBar) handled by root layout
 */

"use client"

import { useParams } from "next/navigation"
import { HorizontalNav } from "@/components/navigation/HorizontalNav"
import { useUserRole } from "@/hooks/useUserRole"

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params?.id as string
  const { role } = useUserRole()
  const isPartner = role === "partner"

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-20 md:pb-0">
      {/* Horizontal Navigation - Sticky below TopHeaderBar (Story 10.12) */}
      {projectId && <HorizontalNav projectId={projectId} isPartner={isPartner} />}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
