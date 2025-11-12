"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ProjectMap } from "@/components/maps/ProjectMap"
import { FileDown } from "lucide-react"
import { useUserRole } from "@/hooks/useUserRole"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"
import { ProjectQuickActions } from "@/components/navigation/quick-actions"
import { ProjectSwitcher } from "@/components/navigation/project-switcher"
import { ReportOptionsModal } from "@/components/reports/ReportOptionsModal"

/**
 * ProjectDetailPage - Display project overview and basic information
 * Story 10.4: Horizontal Top Navigation for Subsections
 *
 * Shows project details with horizontal navigation to other sections (costs, timeline, documents)
 */
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  if (!params) return null
  const projectId = params.id as string
  const utils = api.useUtils()
  const { role } = useUserRole()
  const isPartner = role === "partner"

  const { data: project, isLoading, error } = api.projects.getById.useQuery({ id: projectId })

  // Fetch all projects for ProjectSwitcher
  const { data: allProjects = [] } = api.projects.list.useQuery()

  const deleteMutation = api.projects.softDelete.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.projects.list.cancel()

      // Snapshot previous value
      const previousProjects = utils.projects.list.getData()

      // Optimistically update to remove the project
      utils.projects.list.setData(undefined, (old) => old?.filter((p) => p.id !== projectId) ?? [])

      return { previousProjects }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        utils.projects.list.setData(undefined, context.previousProjects)
      }
      toast({
        title: "Error",
        description: err.message || "Failed to delete project",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
      router.push("/projects" as never)
    },
    onSettled: () => {
      void utils.projects.list.invalidate()
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate({ id: projectId })
    setDeleteDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-10 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="px-6 py-10 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load project</p>
          <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-600",
  }

  const typeLabels: Record<string, string> = {
    renovation: "Renovation",
    new_build: "New Build",
    development: "Development",
    maintenance: "Maintenance",
  }

  return (
    <div className="px-6 py-10 max-w-4xl">
      {/* Breadcrumb and Project Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb items={breadcrumbHelpers.project(project.name, project.id)} />
        <ProjectSwitcher
          currentProjectId={project.id}
          projects={allProjects.map((p) => ({
            id: p.id,
            name: p.name,
            address: (p.address as any)?.formattedAddress, // eslint-disable-line @typescript-eslint/no-explicit-any
          }))}
        />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <Badge className={statusColors[project.status] || "bg-gray-100 text-gray-800"}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex gap-2">
          <ProjectQuickActions projectId={project.id} />
          <Button variant="outline" onClick={() => setReportModalOpen(true)}>
            <FileDown className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          {!isPartner && (
            <>
              <Link href={`/projects/${project.id}/edit` as never}>
                <Button variant="outline" disabled={deleteMutation.isPending}>
                  Edit
                </Button>
              </Link>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={deleteMutation.isPending}>
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this project? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Description</h3>
                <p>{project.description}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Project Type</h3>
                <p>{typeLabels[project.projectType] || project.projectType}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Status</h3>
                <p className="capitalize">{project.status.replace("_", " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        {project.address && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{project.address.formattedAddress || "No address provided"}</p>
              <ProjectMap address={project.address} />
            </CardContent>
          </Card>
        )}

        {/* Dates & Budget */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline & Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {project.startDate && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Start Date</h3>
                  <p>{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">End Date</h3>
                  <p>{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {project.totalBudget !== null && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Total Budget</h3>
                <p>${project.totalBudget.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Options Modal */}
      <ReportOptionsModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  )
}
