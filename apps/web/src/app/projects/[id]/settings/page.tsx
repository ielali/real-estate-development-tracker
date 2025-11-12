"use client"

import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"
import { ProjectQuickActions } from "@/components/navigation/quick-actions"
import { ProjectSwitcher } from "@/components/navigation/project-switcher"
import { ProjectBackupSection } from "@/components/projects/ProjectBackupSection"
import { BackupHistoryList } from "@/components/projects/BackupHistoryList"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Settings } from "lucide-react"
import { useUserRole } from "@/hooks/useUserRole"

/**
 * ProjectSettingsPage - Project settings and configuration
 *
 * Story 6.2: Provides backup and export functionality for project owners
 *
 * Features:
 * - Project backup (JSON and ZIP)
 * - Backup history
 * - RBAC enforcement (owner-only access)
 */
export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  if (!params) return null
  const projectId = params.id as string
  const { isLoading: roleLoading } = useUserRole()

  // Fetch project data
  const { data: project, isLoading, error } = api.projects.getById.useQuery({ id: projectId })

  // Fetch all projects for ProjectSwitcher
  const { data: allProjects = [] } = api.projects.list.useQuery()

  if (isLoading || roleLoading) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message || "Project not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Only project owners can access settings
  // Check project.access field which can be "owner" or "partner"
  const isOwner = (project as any).access === "owner" // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!isOwner) {
    return (
      <div>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              Only project owners can access project settings and backups.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        {/* Navigation Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ProjectSwitcher currentProjectId={projectId} projects={allProjects as any} />{" "}
            {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            <Breadcrumb items={breadcrumbHelpers.getSettingsBreadcrumbs(project, router)} />
          </div>
          <ProjectQuickActions projectId={projectId} />
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Project Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage backup and export options for {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Backup Section */}
          <ProjectBackupSection projectId={projectId} projectName={project.name} />

          {/* Backup History */}
          <BackupHistoryList projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
