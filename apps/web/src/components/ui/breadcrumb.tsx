import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { Fragment } from "react"

/**
 * Breadcrumb navigation component
 * Provides hierarchical navigation with visual feedback
 */

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/", icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1

          return (
            <Fragment key={index}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href as never}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "flex items-center space-x-1",
                      isLast ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                )}
              </li>
              {!isLast && (
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Breadcrumb separator component for custom layouts
 */
export function BreadcrumbSeparator() {
  return <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
}

/**
 * Helper to build breadcrumbs for common routes
 */
export const breadcrumbHelpers = {
  projects: (): BreadcrumbItem[] => [{ label: "Projects", href: "/projects" }],

  project: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
  ],

  projectCosts: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
    { label: "Costs", href: `/projects/${projectId}/costs` },
  ],

  projectDocuments: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
    { label: "Documents", href: `/projects/${projectId}/documents` },
  ],

  projectContacts: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
    { label: "Contacts", href: `/projects/${projectId}/contacts` },
  ],

  projectEvents: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
    { label: "Events", href: `/projects/${projectId}/events` },
  ],

  newProject: (): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: "New Project" },
  ],

  editProject: (projectName: string, projectId: string): BreadcrumbItem[] => [
    { label: "Projects", href: "/projects" },
    { label: projectName, href: `/projects/${projectId}` },
    { label: "Edit" },
  ],
}
