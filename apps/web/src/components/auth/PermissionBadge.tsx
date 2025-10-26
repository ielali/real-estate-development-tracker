/**
 * PermissionBadge Component
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Displays user's permission level with consistent styling across the application.
 * Shows icon + text + optional tooltip for clarity.
 *
 * Visual Design:
 * - Owner (Blue): Full control indicator
 * - Write (Green): Active participation indicator
 * - Read (Gray): Passive observation indicator
 *
 * Accessibility:
 * - Includes icon + text (not icon-only)
 * - Tooltips provide additional context
 * - Color is not the only indicator (text + icon used)
 *
 * @example
 * ```tsx
 * <PermissionBadge permission="owner" />
 * <PermissionBadge permission="write" showTooltip={false} />
 * <PermissionBadge permission="read" />
 * ```
 */

import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Shield } from "lucide-react"

export interface PermissionBadgeProps {
  permission: "owner" | "read" | "write"
  className?: string
}

export function PermissionBadge({ permission, className = "" }: PermissionBadgeProps) {
  const config = {
    owner: {
      icon: Shield,
      text: "Owner",
      title: "Full access - you own this project",
      colorClass: "bg-blue-500 text-white hover:bg-blue-600",
    },
    write: {
      icon: Edit,
      text: "Can Edit",
      title: "You can view and edit costs, documents, and events",
      colorClass: "bg-green-500 text-white hover:bg-green-600",
    },
    read: {
      icon: Eye,
      text: "View Only",
      title: "You can view this project but cannot make changes",
      colorClass: "bg-gray-500 text-white hover:bg-gray-600",
    },
  }

  // Safety check: default to "read" if permission is invalid
  const permissionConfig = config[permission] || config.read
  const { icon: Icon, text, title, colorClass } = permissionConfig

  return (
    <Badge className={`inline-flex items-center gap-1.5 ${colorClass} ${className}`} title={title}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </Badge>
  )
}
