"use client"

import * as React from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/utils/currency"
import { Badge } from "@/components/ui/badge"
import { DollarSign, FolderKanban, Tag } from "lucide-react"

export interface ContactSpendingProps {
  /**
   * Contact ID to display spending for
   */
  contactId: string
}

/**
 * ContactSpending - Displays spending summary for a contact
 *
 * Shows:
 * - Total spending across all projects
 * - Spending breakdown by project
 * - Spending breakdown by category
 * - Empty state when no costs linked
 *
 * Mobile-optimized with responsive grid layout
 */
export function ContactSpending({ contactId }: ContactSpendingProps) {
  const { data, isLoading, isError } = api.costs.getContactSpending.useQuery({ contactId })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Summary
          </CardTitle>
          <CardDescription>Total costs associated with this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="Failed to load spending data" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.totalSpending === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Summary
          </CardTitle>
          <CardDescription>Total costs associated with this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No costs linked"
            description="This contact hasn't been associated with any costs yet"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Spending Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Spending
          </CardTitle>
          <CardDescription>Total costs associated with this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(data.totalSpending)}</div>
        </CardContent>
      </Card>

      {/* Spending by Project */}
      {data.projectBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Spending by Project
            </CardTitle>
            <CardDescription>Breakdown of costs across projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.projectBreakdown
                .sort((a, b) => b.total - a.total)
                .map((project) => (
                  <div
                    key={project.projectId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{project.projectName}</span>
                    <Badge variant="secondary">{formatCurrency(project.total)}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending by Category */}
      {data.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Spending by Category
            </CardTitle>
            <CardDescription>Breakdown of costs by cost category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryBreakdown
                .sort((a, b) => b.total - a.total)
                .map((category) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{category.categoryName}</span>
                    <Badge variant="secondary">{formatCurrency(category.total)}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
