"use client"

import * as React from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/utils/currency"
import { getCategoryById } from "@/server/db/types"
import { ChevronDown, ChevronUp, Tag } from "lucide-react"

export interface CategoryGroupedCostsProps {
  /**
   * Project ID to display costs for
   */
  projectId: string
}

/**
 * CategoryGroupedCosts - Displays costs grouped by category
 *
 * Features:
 * - Costs organized under category names
 * - Parent category grouping with child categories
 * - Total per category displayed
 * - Sorted by spending (highest first)
 * - Collapsible groups for better mobile UX
 *
 * Mobile-optimized with collapsible sections
 */
export function CategoryGroupedCosts({ projectId }: CategoryGroupedCostsProps) {
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(new Set())

  const { data: costsData, isLoading, isError } = api.costs.list.useQuery({ projectId })

  const toggleGroup = (categoryId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (!costsData) return
    const allCategories = [...new Set(costsData.map((cost) => cost.categoryId))]
    if (openGroups.size === allCategories.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(new Set(allCategories))
    }
  }

  // Group costs by category
  const groupedCosts = React.useMemo(() => {
    if (!costsData) return []

    const groups = costsData.reduce(
      (acc, cost) => {
        const categoryId = cost.categoryId
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName: cost.category?.displayName ?? "Unknown",
            parentCategoryId: cost.category?.parentId ?? null,
            costs: [],
            total: 0,
          }
        }
        acc[categoryId].costs.push(cost)
        acc[categoryId].total += cost.amount
        return acc
      },
      {} as Record<
        string,
        {
          categoryId: string
          categoryName: string
          parentCategoryId: string | null
          costs: typeof costsData
          total: number
        }
      >
    )

    // Convert to array and sort by total (descending)
    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [costsData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="Failed to load costs by category" />
  }

  if (!costsData || costsData.length === 0) {
    return (
      <EmptyState
        title="No costs found"
        description="No costs have been added to this project yet"
      />
    )
  }

  const allExpanded = openGroups.size === groupedCosts.length

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse all */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {groupedCosts.length} categor{groupedCosts.length !== 1 ? "ies" : "y"} with costs
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allExpanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {groupedCosts.map((group) => {
          const isOpen = openGroups.has(group.categoryId)
          const parentCategory = group.parentCategoryId
            ? getCategoryById(group.parentCategoryId)
            : null

          return (
            <Card key={group.categoryId}>
              <CardHeader
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => toggleGroup(group.categoryId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{group.categoryName}</CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {parentCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {parentCategory.displayName}
                          </Badge>
                        )}
                        <span>
                          {group.costs.length} cost{group.costs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-sm font-semibold">
                      {formatCurrency(group.total)}
                    </Badge>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent>
                  <div className="space-y-2">
                    {group.costs.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{cost.description}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(cost.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="font-semibold">{formatCurrency(cost.amount)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
