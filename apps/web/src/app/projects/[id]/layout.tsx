/**
 * Project Detail Layout
 * Story 10.4: Horizontal Top Navigation for Subsections
 *
 * Wraps all project detail pages with:
 * - Global Navbar
 * - Horizontal navigation for subsections
 * - Responsive content area
 */

"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { HorizontalNav } from "@/components/navigation/HorizontalNav"
import { useUserRole } from "@/hooks/useUserRole"

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const projectId = params?.id as string
  const { role } = useUserRole()
  const isPartner = role === "partner"

  return (
    <>
      <Navbar />
      <div className="flex flex-col h-[calc(100vh-4rem)] pb-20 md:pb-0">
        {/* Horizontal Navigation - Sticky at top */}
        {projectId && <HorizontalNav projectId={projectId} isPartner={isPartner} />}

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  )
}
