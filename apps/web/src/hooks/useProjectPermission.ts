/**
 * useProjectPermission Hook
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Provides access permission level for a specific project and helper booleans
 * for common permission checks.
 *
 * Permission Levels:
 * - **owner**: Full access (read, write, delete, invite partners)
 * - **write**: Partner with write access (can add costs, upload documents)
 * - **read**: Partner with read-only access (view only)
 * - **none**: No access to this project
 *
 * @param projectId - UUID of the project to check permissions for
 *
 * @example
 * ```tsx
 * function ProjectActions({ projectId }: { projectId: string }) {
 *   const { canEdit, canDelete, canInvite, isLoading } = useProjectPermission(projectId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <div>
 *       {canEdit && <Button onClick={handleEdit}>Edit Cost</Button>}
 *       {canDelete && <Button onClick={handleDelete}>Delete Project</Button>}
 *       {canInvite && <Button onClick={handleInvite}>Invite Partner</Button>}
 *     </div>
 *   )
 * }
 * ```
 */

import { api } from "@/lib/trpc/client"

export interface ProjectPermission {
  level: "owner" | "read" | "write" | "none"
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  isLoading: boolean
}

export function useProjectPermission(projectId: string): ProjectPermission {
  // Fetch project to get permission metadata
  const { data: project, isLoading } = api.projects.getById.useQuery(
    { id: projectId },
    {
      enabled: !!projectId,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  )

  const level: "read" | "write" | "none" = (project?.userPermission as "read" | "write") || "none"
  const access: "owner" | "partner" | "none" = project?.access || "none"

  // Determine actual permission level
  let permissionLevel: "owner" | "read" | "write" | "none" = "none"
  if (access === "owner") {
    permissionLevel = "owner"
  } else {
    permissionLevel = level
  }

  return {
    level: permissionLevel,
    canView: (permissionLevel as string) !== "none",
    canEdit: permissionLevel === "owner" || permissionLevel === "write",
    canDelete: permissionLevel === "owner",
    canInvite: permissionLevel === "owner",
    isLoading,
  }
}
