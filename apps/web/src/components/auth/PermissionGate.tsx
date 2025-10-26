/**
 * PermissionGate Component
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Conditionally renders children based on user's project-specific permission level.
 * Used for permission-based UI rendering (edit buttons, delete actions, etc.).
 *
 * @param projectId - UUID of the project to check permissions for
 * @param requiredPermission - Minimum permission level required
 * @param fallback - Optional component to render if user doesn't have required permission
 * @param children - Content to render if user has required permission
 *
 * @example
 * ```tsx
 * // Only show edit button to users who can edit
 * <PermissionGate projectId={projectId} requiredPermission="write">
 *   <Button onClick={handleEdit}>Edit Cost</Button>
 * </PermissionGate>
 *
 * // Only show delete button to project owners
 * <PermissionGate projectId={projectId} requiredPermission="owner">
 *   <Button onClick={handleDelete} variant="destructive">Delete Project</Button>
 * </PermissionGate>
 *
 * // Show different content for read-only users
 * <PermissionGate
 *   projectId={projectId}
 *   requiredPermission="write"
 *   fallback={<p className="text-muted-foreground">View-only access</p>}
 * >
 *   <CostEntryForm />
 * </PermissionGate>
 * ```
 */

import React, { ReactNode } from "react"
import { useProjectPermission } from "@/hooks/useProjectPermission"

export interface PermissionGateProps {
  projectId: string
  requiredPermission: "owner" | "write" | "read"
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  projectId,
  requiredPermission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { level, isLoading } = useProjectPermission(projectId)

  // While loading, don't show anything to prevent flashing
  if (isLoading) {
    return null
  }

  // Define permission hierarchy
  const permissionHierarchy = {
    none: 0,
    read: 1,
    write: 2,
    owner: 3,
  }

  const userLevel = permissionHierarchy[level]
  const requiredLevel = permissionHierarchy[requiredPermission]

  // Check if user has required permission level
  if (userLevel < requiredLevel) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
