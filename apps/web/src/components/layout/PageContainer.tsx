/**
 * PageContainer - Standard page content wrapper
 * Story 10.15: Content Layout Fix
 *
 * Provides consistent padding and optional max-width constraints.
 * Content expands to fill available width (not centered).
 *
 * @example
 * ```tsx
 * // Dashboard - full-width grid
 * <PageContainer maxWidth="7xl">
 *   <h1>Dashboard</h1>
 *   {-- project cards grid --}
 * </PageContainer>
 * ```
 *
 * @example
 * ```tsx
 * // Form page - narrow width
 * <PageContainer maxWidth="2xl">
 *   <h1>Create Project</h1>
 *   {-- form --}
 * </PageContainer>
 * ```
 */

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "7xl" | "full"

interface PageContainerProps {
  children: ReactNode
  maxWidth?: MaxWidth
  className?: string
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-sm", // 640px - narrow forms
  md: "max-w-md", // 768px - medium forms
  lg: "max-w-lg", // 1024px - reading content
  xl: "max-w-xl", // 1280px - wider content
  "2xl": "max-w-2xl", // 1536px - forms, details
  "4xl": "max-w-4xl", // 1792px - detail pages
  "7xl": "max-w-7xl", // 2560px - lists, tables
  full: "max-w-none", // no limit - full width
}

export function PageContainer({ children, maxWidth = "7xl", className }: PageContainerProps) {
  return <div className={cn("px-6 py-6", maxWidthClasses[maxWidth], className)}>{children}</div>
}
