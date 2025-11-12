"use client"

import { useParams, useSearchParams } from "next/navigation"
import { Suspense, lazy, useState } from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
 * Project Costs Page
 * Story 10.4: Horizontal Top Navigation for Subsections
 *
 * Displays all costs for a project with filtering, searching, and grouping options
 */
export default function ProjectCostsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params?.id as string

  // Get costId from URL query params (for notification navigation - Story 8.1)
  const costIdParam = searchParams?.get("costId")

  const [costsViewMode, setCostsViewMode] = useState<"list" | "contact" | "category">("list")

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

  // Fetch project for name
  const { data: project } = api.projects.getById.useQuery({ id: projectId })

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
            .filter((c: any) => c.category) // eslint-disable-line @typescript-eslint/no-explicit-any
            .map((c: any) => [
              // eslint-disable-line @typescript-eslint/no-explicit-any
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
            .filter((c: any) => c.contact) // eslint-disable-line @typescript-eslint/no-explicit-any
            .map((c: any) => [
              // eslint-disable-line @typescript-eslint/no-explicit-any
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

  if (!projectId || !project) {
    return (
      <div className="px-6 py-10 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading project costs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-10 max-w-7xl">
      {/* Category Spending Breakdown */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded mb-6"></div>}>
        <CategorySpendingBreakdown projectId={projectId} showChart={true} />
      </Suspense>

      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <Suspense fallback={<div className="h-10 w-48 animate-pulse bg-gray-200 rounded"></div>}>
          <CategoryExportButton projectId={projectId} projectName={project.name} />
        </Suspense>
      </div>

      {/* Costs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Costs</CardTitle>
            <Select
              value={costsViewMode}
              onValueChange={(value) => setCostsViewMode(value as "list" | "contact" | "category")}
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
              projectId={projectId}
              filters={filters}
              searchText={searchText}
              sortBy={sortBy}
              sortDirection={sortDirection}
              resultCount={costsData?.length}
              onFilterChange={setFilters}
              onSearchChange={setSearchText}
              onSortChange={handleSortChange}
              onClearAll={handleClearAll}
              categories={(categories ?? []) as any[]} // eslint-disable-line @typescript-eslint/no-explicit-any
              contacts={(contacts ?? []) as any[]} // eslint-disable-line @typescript-eslint/no-explicit-any
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
                projectId={projectId}
                filters={filters}
                searchText={searchText}
                sortBy={sortBy}
                sortDirection={sortDirection}
                highlightCostId={costIdParam || undefined}
              />
            ) : costsViewMode === "contact" ? (
              <ContactGroupedCosts projectId={projectId} />
            ) : (
              <CategoryGroupedCosts projectId={projectId} />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
