"use client"

import { useRouter } from "next/navigation"
import {
  DollarSign,
  FileText,
  Users,
  Calendar,
  Plus,
  FolderPlus,
  Upload,
  UserPlus,
  CalendarPlus,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * Quick action menus for common tasks
 * Context-aware based on current location
 */

export interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  shortcut?: string
  disabled?: boolean
}

interface QuickActionsMenuProps {
  actions: QuickAction[]
  label?: string
  className?: string
}

export function QuickActionsMenu({
  actions,
  label = "Quick Actions",
  className,
}: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {action.icon}
                <span>{action.label}</span>
              </div>
              {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Pre-built quick action menus for common contexts
 */

interface ProjectQuickActionsProps {
  projectId: string
  onAddCost?: () => void
  onUploadDocument?: () => void
  onAddContact?: () => void
  onAddEvent?: () => void
  className?: string
}

export function ProjectQuickActions({
  projectId,
  onAddCost,
  onUploadDocument,
  onAddContact,
  onAddEvent,
  className,
}: ProjectQuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: "Add Cost",
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onAddCost || (() => router.push(`/projects/${projectId}/costs/new`)),
      shortcut: "⌘C",
    },
    {
      label: "Upload Document",
      icon: <FileText className="h-4 w-4" />,
      onClick: onUploadDocument || (() => router.push(`/projects/${projectId}/documents` as never)),
      shortcut: "⌘D",
    },
    {
      label: "Add Contact",
      icon: <Users className="h-4 w-4" />,
      onClick: onAddContact || (() => router.push("/contacts" as never)),
      shortcut: "⌘K",
    },
    {
      label: "Schedule Event",
      icon: <Calendar className="h-4 w-4" />,
      onClick: onAddEvent || (() => router.push(`/projects/${projectId}/events/new` as never)),
      shortcut: "⌘E",
    },
  ]

  return <QuickActionsMenu actions={actions} label="Add" className={className} />
}

interface GlobalQuickActionsProps {
  onNewProject?: () => void
  onAddCost?: () => void
  onUploadDocument?: () => void
  onAddContact?: () => void
  className?: string
}

export function GlobalQuickActions({
  onNewProject,
  onAddCost,
  onUploadDocument,
  onAddContact,
  className,
}: GlobalQuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: "New Project",
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: onNewProject || (() => router.push("/projects/new")),
      shortcut: "⌘N",
    },
    {
      label: "Add Cost",
      icon: <Receipt className="h-4 w-4" />,
      onClick: onAddCost || (() => router.push("/costs/new" as never)),
      shortcut: "⌘C",
    },
    {
      label: "Upload Document",
      icon: <Upload className="h-4 w-4" />,
      onClick: onUploadDocument || (() => router.push("/projects" as never)),
      shortcut: "⌘D",
    },
    {
      label: "Add Contact",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: onAddContact || (() => router.push("/contacts" as never)),
      shortcut: "⌘K",
    },
  ]

  return <QuickActionsMenu actions={actions} label="New" className={className} />
}

interface CostQuickActionsProps {
  projectId?: string
  onAddCost?: () => void
  onCreateTemplate?: () => void
  onImportCosts?: () => void
  className?: string
}

export function CostQuickActions({
  projectId,
  onAddCost,
  onCreateTemplate,
  onImportCosts,
  className,
}: CostQuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: "Add Cost Entry",
      icon: <Plus className="h-4 w-4" />,
      onClick:
        onAddCost ||
        (() => {
          if (projectId) {
            router.push(`/projects/${projectId}/costs/new` as never)
          } else {
            router.push("/costs/new" as never)
          }
        }),
      shortcut: "⌘N",
    },
    {
      label: "Create Template",
      icon: <FileText className="h-4 w-4" />,
      onClick: onCreateTemplate || (() => router.push("/costs/templates/new" as never)),
      shortcut: "⌘T",
    },
    {
      label: "Import Costs",
      icon: <Upload className="h-4 w-4" />,
      onClick: onImportCosts || (() => {}),
      shortcut: "⌘I",
      disabled: !onImportCosts,
    },
  ]

  return <QuickActionsMenu actions={actions} label="Actions" className={className} />
}

interface DocumentQuickActionsProps {
  projectId?: string
  onUpload?: () => void
  onUploadMultiple?: () => void
  onCreateFolder?: () => void
  className?: string
}

export function DocumentQuickActions({
  projectId: _projectId,
  onUpload,
  onUploadMultiple,
  onCreateFolder,
  className,
}: DocumentQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: "Upload Document",
      icon: <Upload className="h-4 w-4" />,
      onClick: onUpload || (() => {}),
      shortcut: "⌘U",
    },
    {
      label: "Upload Multiple",
      icon: <FileText className="h-4 w-4" />,
      onClick: onUploadMultiple || (() => {}),
      shortcut: "⌘⇧U",
    },
    {
      label: "Create Folder",
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: onCreateFolder || (() => {}),
      shortcut: "⌘F",
      disabled: !onCreateFolder,
    },
  ]

  return <QuickActionsMenu actions={actions} label="Upload" className={className} />
}

interface EventQuickActionsProps {
  projectId?: string
  onAddEvent?: () => void
  onAddMilestone?: () => void
  onScheduleMeeting?: () => void
  className?: string
}

export function EventQuickActions({
  projectId,
  onAddEvent,
  onAddMilestone,
  onScheduleMeeting,
  className,
}: EventQuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      label: "Add Event",
      icon: <CalendarPlus className="h-4 w-4" />,
      onClick:
        onAddEvent ||
        (() => {
          if (projectId) {
            router.push(`/projects/${projectId}/events/new` as never)
          } else {
            router.push("/events/new" as never)
          }
        }),
      shortcut: "⌘E",
    },
    {
      label: "Add Milestone",
      icon: <Calendar className="h-4 w-4" />,
      onClick: onAddMilestone || (() => {}),
      disabled: !onAddMilestone,
    },
    {
      label: "Schedule Meeting",
      icon: <Users className="h-4 w-4" />,
      onClick: onScheduleMeeting || (() => {}),
      disabled: !onScheduleMeeting,
    },
  ]

  return <QuickActionsMenu actions={actions} label="Schedule" className={className} />
}
