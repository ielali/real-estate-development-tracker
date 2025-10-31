import React, { ReactNode } from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import {
  FolderOpen,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Search,
  AlertCircle,
  Plus,
  LucideIcon,
} from "lucide-react"

/**
 * Empty state components for various scenarios
 * Provides helpful guidance when lists/tables are empty
 */

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?:
    | {
        label: string
        onClick: () => void
      }
    | ReactNode
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  // Check if action is the new format or old ReactNode format
  const isActionObject =
    action && typeof action === "object" && "label" in action && "onClick" in action

  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <div className="mt-4">
          {isActionObject ? (
            <Button onClick={(action as { label: string; onClick: () => void }).onClick}>
              <Plus className="mr-2 h-4 w-4" />
              {(action as { label: string; onClick: () => void }).label}
            </Button>
          ) : (
            action
          )}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

// Specific empty states for common scenarios

export function EmptyProjects({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      description="Get started by creating your first real estate development project."
      action={{
        label: "Create Project",
        onClick: onCreateProject,
      }}
    />
  )
}

export function EmptyCosts({ onAddCost }: { onAddCost: () => void }) {
  return (
    <EmptyState
      icon={DollarSign}
      title="No costs recorded"
      description="Start tracking project expenses by adding your first cost entry."
      action={{
        label: "Add Cost",
        onClick: onAddCost,
      }}
    />
  )
}

export function EmptyDocuments({ onUploadDocument }: { onUploadDocument: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents uploaded"
      description="Upload contracts, permits, invoices, and other project documents."
      action={{
        label: "Upload Document",
        onClick: onUploadDocument,
      }}
    />
  )
}

export function EmptyContacts({ onAddContact }: { onAddContact: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No contacts yet"
      description="Add contractors, vendors, architects, and other project contacts."
      action={{
        label: "Add Contact",
        onClick: onAddContact,
      }}
    />
  )
}

export function EmptyEvents({ onAddEvent }: { onAddEvent: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No events scheduled"
      description="Track inspections, meetings, milestones, and important project dates."
      action={{
        label: "Add Event",
        onClick: onAddEvent,
      }}
    />
  )
}

export function EmptySearchResults({
  query,
  onClearSearch,
}: {
  query: string
  onClearSearch?: () => void
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
    >
      {onClearSearch && (
        <Button variant="outline" onClick={onClearSearch} className="mt-2">
          Clear search
        </Button>
      )}
    </EmptyState>
  )
}

export function EmptyFilteredResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No matches found"
      description="No items match the current filters. Try adjusting your filter criteria."
    >
      <Button variant="outline" onClick={onClearFilters} className="mt-2">
        Clear filters
      </Button>
    </EmptyState>
  )
}

export function EmptyError({
  title = "Something went wrong",
  description = "We encountered an error loading this data.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState icon={AlertCircle} title={title} description={description}>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </EmptyState>
  )
}

export function EmptyCostTemplates({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  return (
    <EmptyState
      icon={DollarSign}
      title="No cost templates"
      description="Create reusable templates for recurring expenses to save time on data entry."
      action={{
        label: "Create Template",
        onClick: onCreateTemplate,
      }}
    />
  )
}

export function EmptyProjectAccess({ onInviteUser }: { onInviteUser: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members"
      description="Invite partners, stakeholders, or team members to collaborate on this project."
      action={{
        label: "Invite User",
        onClick: onInviteUser,
      }}
    />
  )
}

// Compact empty state for smaller containers (like cards)
export function CompactEmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon?: LucideIcon
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-2" />}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Button variant="link" onClick={action.onClick} size="sm" className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
