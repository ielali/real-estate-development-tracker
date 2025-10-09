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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SearchAndFilter } from "@/components/costs/SearchAndFilter"
import { useCostFilters } from "@/hooks/useCostFilters"
import { useFilterPersistence, loadSavedFilters } from "@/hooks/useFilterPersistence"

// Lazy load the costs components
const CostsList = lazy(() =>
  import("@/components/costs/CostsList").then((mod) => ({ default: mod.CostsList }))
)
const ContactGroupedCosts = lazy(() =>
  import("@/components/costs/ContactGroupedCosts").then((mod) => ({
    default: mod.ContactGroupedCosts,
  }))
)
const CategoryGroupedCosts = lazy(() =>
  import("@/components/costs/CategoryGroupedCosts").then((mod) => ({
    default: mod.CategoryGroupedCosts,
  }))
)
const CategorySpendingBreakdown = lazy(() =>
  import("@/components/costs/CategorySpendingBreakdown").then((mod) => ({
    default: mod.CategorySpendingBreakdown,
  }))
)
const CategoryExportButton = lazy(() =>
  import("@/components/costs/CategoryExportButton").then((mod) => ({
    default: mod.CategoryExportButton,
  }))
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
  const [costsViewMode, setCostsViewMode] = useState<"list" | "contact" | "category">("list")

  const projectId = params.id as string
  const utils = api.useUtils()

  // Load saved filters from sessionStorage on mount
  const savedFilters = loadSavedFilters(projectId)

  // Initialize filter state with saved values or defaults
  const {
    filters,
    searchText,
    sortBy,
    sortDirection,
    setFilters,
    setSearchText,
    setSortBy,
    setSortDirection,
    clearFilters,
  } = useCostFilters(
    savedFilters?.filters ?? {},
    savedFilters?.searchText ?? "",
    savedFilters?.sortBy ?? "date",
    savedFilters?.sortDirection ?? "desc"
  )

  // Persist filters to sessionStorage
  useFilterPersistence(projectId, filters, searchText, sortBy, sortDirection)

  const { data: project, isLoading, error } = api.projects.getById.useQuery({ id: projectId })

  // Fetch costs with filters for result count
  const { data: costsData } = api.costs.list.useQuery({
    projectId,
    ...filters,
    searchText: searchText || undefined,
    sortBy,
    sortDirection,
  })

  // Extract unique categories and contacts from costs data for filter dropdowns
  const categories = costsData
    ? Array.from(
        new Map(
          costsData
            .filter((c) => c.category)
            .map((c) => [
              c.category!.id,
              { id: c.category!.id, displayName: c.category!.displayName },
            ])
        ).values()
      )
    : []

  const contacts = costsData
    ? Array.from(
        new Map(
          costsData
            .filter((c) => c.contact)
            .map((c) => [
              c.contact!.id,
              {
                id: c.contact!.id,
                firstName: c.contact!.firstName,
                lastName: c.contact!.lastName,
              },
            ])
        ).values()
      )
    : []

  const handleSortChange = (newSortBy: typeof sortBy, newSortDirection: typeof sortDirection) => {
    setSortBy(newSortBy)
    setSortDirection(newSortDirection)
  }

  const handleClearAll = () => {
    clearFilters()
  }

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
            {/* Category Spending Breakdown */}
            <Suspense
              fallback={<div className="h-64 animate-pulse bg-gray-200 rounded mb-6"></div>}
            >
              <CategorySpendingBreakdown projectId={project.id} showChart={true} />
            </Suspense>

            {/* Export Button */}
            <div className="mb-6 flex justify-end">
              <Suspense
                fallback={<div className="h-10 w-48 animate-pulse bg-gray-200 rounded"></div>}
              >
                <CategoryExportButton projectId={project.id} projectName={project.name} />
              </Suspense>
            </div>

            {/* Costs List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Costs</CardTitle>
                  <Select
                    value={costsViewMode}
                    onValueChange={(value) =>
                      setCostsViewMode(value as "list" | "contact" | "category")
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">None</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search and Filter Component - Story 2.4 */}
                {costsViewMode === "list" && (
                  <SearchAndFilter
                    projectId={project.id}
                    filters={filters}
                    searchText={searchText}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    resultCount={costsData?.length}
                    onFilterChange={setFilters}
                    onSearchChange={setSearchText}
                    onSortChange={handleSortChange}
                    onClearAll={handleClearAll}
                    categories={categories ?? []}
                    contacts={contacts ?? []}
                  />
                )}

                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  }
                >
                  {costsViewMode === "list" ? (
                    <CostsList
                      projectId={project.id}
                      filters={filters}
                      searchText={searchText}
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                    />
                  ) : costsViewMode === "contact" ? (
                    <ContactGroupedCosts projectId={project.id} />
                  ) : (
                    <CategoryGroupedCosts projectId={project.id} />
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
