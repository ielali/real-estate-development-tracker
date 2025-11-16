"use client"

import { useSession } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Download, Loader2, RefreshCw } from "lucide-react"
import { PortfolioSummaryCard } from "@/components/portfolio/PortfolioSummaryCard"
import { CostPerSqftChart } from "@/components/portfolio/CostPerSqftChart"
import { CategoryComparisonChart } from "@/components/portfolio/CategoryComparisonChart"
import { TimelineDurationChart } from "@/components/portfolio/TimelineDurationChart"
import { CostTrendsChart } from "@/components/portfolio/CostTrendsChart"
import { CommonCategoriesChart } from "@/components/portfolio/CommonCategoriesChart"
import { TopVendorsTable } from "@/components/portfolio/TopVendorsTable"
import { PortfolioFilters } from "@/components/portfolio/PortfolioFilters"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"

/**
 * Portfolio Analytics Page
 *
 * Story 9.2: Multi-Project Comparative Analytics
 *
 * Provides comparative analytics across multiple projects including:
 * - Cost per square meter comparison
 * - Category spend analysis
 * - Timeline duration comparison
 * - Cost trends over time
 * - Most common categories
 * - Top vendors across portfolio
 */

// Maximum number of projects that can be compared at once
// Limits query complexity and ensures charts remain readable
const MAX_PROJECTS = 15

export default function PortfolioPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = useSession()
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<Array<"active" | "on_hold" | "completed">>([])
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined)

  // Fetch user's projects
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = api.portfolio.getPortfolioProjects.useQuery(undefined, {
    enabled: !!session?.user,
  })

  // Fetch portfolio analytics with caching
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
    isFetching,
  } = api.portfolio.getPortfolioAnalytics.useQuery(
    {
      projectIds: selectedProjectIds,
      dateRange,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
    },
    {
      enabled: selectedProjectIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in React Query v4)
    }
  )

  // Export portfolio data
  const exportMutation = api.portfolio.exportPortfolioData.useMutation()

  const handleExport = async (format: "csv") => {
    try {
      const result = await exportMutation.mutateAsync({
        projectIds: selectedProjectIds,
        format,
      })

      // Download the CSV
      const blob = new Blob([result.content], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      // If already selected, remove it
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId)
      }
      // If at max limit, don't add more
      if (prev.length >= MAX_PROJECTS) {
        return prev
      }
      // Add the project
      return [...prev, projectId]
    })
  }

  const toggleSelectAll = () => {
    if (!projectsData) return
    if (selectedProjectIds.length === projectsData.projects.length) {
      // Deselect all
      setSelectedProjectIds([])
    } else {
      // Select up to MAX_PROJECTS
      const projectsToSelect = projectsData.projects
        .map((p: { id: string }) => p.id)
        .slice(0, MAX_PROJECTS)
      setSelectedProjectIds(projectsToSelect)
    }
  }

  // Redirect if not authenticated
  if (sessionLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </>
    )
  }

  if (!session?.user) {
    router.push("/login")
    return null
  }

  // Empty state: user has less than 2 projects
  if (!projectsLoading && projectsData && projectsData.totalCount < 2) {
    return (
      <>
        <div className="px-6 py-6 max-w-7xl">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbHelpers.portfolio()} />
          </div>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio analytics requires at least 2 projects</CardTitle>
              <CardDescription>
                Create more projects to unlock comparative analytics across your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/projects")}>View Projects</Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Loading state
  if (projectsLoading || analyticsLoading) {
    return (
      <>
        <div className="px-6 py-6 max-w-7xl">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbHelpers.portfolio()} />
          </div>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </>
    )
  }

  // Error state
  if (projectsError) {
    return (
      <>
        <div className="px-6 py-6 max-w-7xl">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbHelpers.portfolio()} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Error loading portfolio</CardTitle>
              <CardDescription>
                {projectsError.message || "Failed to load portfolio data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbHelpers.portfolio()} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAnalytics()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={exportMutation.isPending || selectedProjectIds.length === 0}
            >
              {exportMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        {/* Project Selector */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Projects to Compare</CardTitle>
                <CardDescription>
                  Choose which projects to include in your portfolio analytics •{" "}
                  {selectedProjectIds.length} of {projectsData?.projects.length || 0} selected (max{" "}
                  {MAX_PROJECTS})
                </CardDescription>
                {selectedProjectIds.length >= MAX_PROJECTS && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Maximum limit reached. Deselect a project to select another.
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedProjectIds.length === projectsData?.projects.length ||
                selectedProjectIds.length === MAX_PROJECTS
                  ? "Deselect All"
                  : `Select First ${Math.min(MAX_PROJECTS, projectsData?.projects.length || 0)}`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projectsData?.projects.map(
                (project: { id: string; name: string; status: string }) => {
                  const isSelected = selectedProjectIds.includes(project.id)
                  const isDisabled = !isSelected && selectedProjectIds.length >= MAX_PROJECTS

                  return (
                    <div key={project.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={project.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => toggleProjectSelection(project.id)}
                      />
                      <Label
                        htmlFor={project.id}
                        className={`text-sm font-medium leading-none cursor-pointer ${
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <div>{project.name}</div>
                        <div className="text-xs text-muted-foreground">{project.status}</div>
                      </Label>
                    </div>
                  )
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <PortfolioFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          disabled={selectedProjectIds.length === 0}
        />

        {selectedProjectIds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Ready to compare your projects?</p>
              <p className="text-sm text-muted-foreground">
                Select one or more projects above to view comparative analytics, charts, and
                insights
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Card */}
            {analytics && <PortfolioSummaryCard data={analytics.summary} />}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {analytics && analytics.costPerSqft.length > 0 && (
                <CostPerSqftChart data={analytics.costPerSqft} />
              )}
              {analytics && analytics.projectDurations.length > 0 && (
                <TimelineDurationChart data={analytics.projectDurations} />
              )}
            </div>

            {/* Full Width Charts */}
            <div className="space-y-6 mt-6">
              {analytics && analytics.categorySpendByProject.length > 0 && (
                <CategoryComparisonChart
                  data={analytics.categorySpendByProject}
                  projects={analytics.projects}
                />
              )}
              {analytics && analytics.costTrends.length > 0 && (
                <CostTrendsChart data={analytics.costTrends} projects={analytics.projects} />
              )}
              {analytics && analytics.commonCategories.length > 0 && (
                <CommonCategoriesChart data={analytics.commonCategories} />
              )}
              {analytics && analytics.topVendors.length > 0 && (
                <TopVendorsTable data={analytics.topVendors} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
