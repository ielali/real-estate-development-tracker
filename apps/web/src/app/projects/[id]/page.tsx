"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense, lazy } from "react"
import { api } from "@/lib/trpc/client"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useState } from "react"
import { ProjectMap } from "@/components/maps/ProjectMap"

// Lazy load the costs list component
const CostsList = lazy(() =>
  import("@/components/costs/CostsList").then((mod) => ({ default: mod.CostsList }))
)

/**
 * ProjectDetailPage - Display detailed information for a single project
 *
 * Shows all project information with options to edit or delete
 * Includes confirmation dialog for delete action
 */
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const projectId = params.id as string
  const utils = api.useUtils()

  const { data: project, isLoading, error } = api.projects.getById.useQuery({ id: projectId })

  const deleteMutation = api.projects.softDelete.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.projects.list.cancel()

      // Snapshot previous value
      const previousProjects = utils.projects.list.getData()

      // Optimistically update to remove the project
      utils.projects.list.setData(
        undefined,
        (old: any) => old?.filter((p: any) => p.id !== projectId) ?? []
      )

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
      <>
        <Navbar />
        <div className="container max-w-4xl py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    )
  }

  if (error || !project) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl py-10">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load project</p>
            <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
          </div>
        </div>
      </>
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
    <>
      <Navbar />
      <div className="container max-w-4xl py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/projects"
            as={"/projects" as never}
            className="text-blue-600 hover:underline"
          >
            ← Back to Projects
          </Link>
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
          </div>
        </div>

        {/* Tabs for Project Details and Costs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
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
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  }
                >
                  <CostsList projectId={project.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
