/**
 * useAccessibleProjects Hook
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Fetches all projects the authenticated user has access to, including:
 * - Projects they own (access: "owner")
 * - Projects they have partner access to (access: "partner")
 *
 * Each project includes permission metadata for UI rendering decisions.
 *
 * @example
 * ```tsx
 * function ProjectList() {
 *   const { projects, isLoading, error } = useAccessibleProjects()
 *
 *   if (isLoading) return <ProjectListSkeleton />
 *   if (error) return <ErrorMessage error={error} />
 *   if (projects.length === 0) return <EmptyState />
 *
 *   return (
 *     <div>
 *       {projects.map(project => (
 *         <ProjectCard
 *           key={project.id}
 *           project={project}
 *           permission={project.userPermission}
 *           access={project.access}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */

import { api } from "@/lib/trpc/client"

export interface AccessibleProject {
  id: string
  name: string
  description: string | null
  status: string
  projectType: string
  userPermission: "read" | "write"
  access: "owner" | "partner"
  address: {
    id: string
    formattedAddress: string | null
  } | null
  createdAt: Date
  updatedAt: Date
}

export interface UseAccessibleProjectsResult {
  projects: AccessibleProject[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useAccessibleProjects(): UseAccessibleProjectsResult {
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = api.projects.list.useQuery(undefined, {
    // Cache for 2 minutes
    staleTime: 2 * 60 * 1000,
  })

  return {
    projects: projects as AccessibleProject[],
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
