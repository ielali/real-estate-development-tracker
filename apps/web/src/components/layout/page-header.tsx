"use client"

import { ReactNode } from "react"
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb"
import { ProjectSwitcher, ProjectSwitcherProject } from "@/components/navigation/project-switcher"
import { cn } from "@/lib/utils"

/**
 * Page header component that combines breadcrumbs, title, and actions
 * Provides consistent page structure across the application
 */

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
  showProjectSwitcher?: boolean
  currentProjectId?: string
  projects?: ProjectSwitcherProject[]
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  showProjectSwitcher,
  currentProjectId,
  projects = [],
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 pb-4", className)}>
      {/* Breadcrumbs and Project Switcher Row */}
      {(breadcrumbs || showProjectSwitcher) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {breadcrumbs && <Breadcrumb items={breadcrumbs} className="hidden sm:flex" />}
            {showProjectSwitcher && currentProjectId && (
              <ProjectSwitcher
                currentProjectId={currentProjectId}
                projects={projects}
                className="sm:ml-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* Title and Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

interface PageHeaderSkeletonProps {
  showBreadcrumbs?: boolean
  showActions?: boolean
  className?: string
}

export function PageHeaderSkeleton({
  showBreadcrumbs = true,
  showActions = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div className={cn("space-y-4 pb-4", className)}>
      {showBreadcrumbs && (
        <div className="flex items-center gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        {showActions && <div className="h-10 w-32 animate-pulse rounded bg-muted" />}
      </div>
    </div>
  )
}

/**
 * Compact page header for mobile or simpler layouts
 */
export function CompactPageHeader({
  title,
  actions,
  className,
}: {
  title: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between pb-4", className)}>
      <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
