/**
 * DataVisualizationDashboard Component
 *
 * Story 4.4 - Data Visualizations
 *
 * Container component that integrates all advanced analytics visualizations:
 * - SpendingTrendChart - Time-series spending data
 * - BudgetComparisonChart - Budget vs actual comparison
 * - VendorDistributionChart - Vendor spending breakdown
 * - ProjectTimelineChart - Milestone timeline
 *
 * Features:
 * - Fetches data from analytics tRPC queries
 * - Unified loading skeleton for all charts
 * - Unified error handling with retry
 * - Responsive grid layout (2 columns on desktop, 1 on mobile)
 * - Professional card-based design
 */

"use client"

import { api } from "@/lib/trpc/client"
import { SpendingTrendChart } from "./SpendingTrendChart"
import { BudgetComparisonChart } from "./BudgetComparisonChart"
import { VendorDistributionChart } from "./VendorDistributionChart"
import { ProjectTimelineChart } from "./ProjectTimelineChart"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface DataVisualizationDashboardProps {
  projectId: string
}

export function DataVisualizationDashboard({ projectId }: DataVisualizationDashboardProps) {
  // Fetch spending trend
  const {
    data: spendingTrend,
    isLoading: trendLoading,
    error: trendError,
    refetch: refetchTrend,
  } = api.partnerDashboard.getSpendingTrend.useQuery({
    projectId,
    timeRange: "daily",
  })

  // Fetch budget comparison
  const {
    data: budgetComparison,
    isLoading: budgetLoading,
    error: budgetError,
    refetch: refetchBudget,
  } = api.partnerDashboard.getBudgetComparison.useQuery({ projectId })

  // Fetch vendor distribution
  const {
    data: vendorDistribution,
    isLoading: vendorLoading,
    error: vendorError,
    refetch: refetchVendor,
  } = api.partnerDashboard.getVendorDistribution.useQuery({ projectId })

  // Fetch project timeline
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = api.partnerDashboard.getProjectTimeline.useQuery({ projectId })

  // Overall loading state
  const isLoading = trendLoading || budgetLoading || vendorLoading || timelineLoading
  const hasError = trendError || budgetError || vendorError || timelineError

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
          <p className="text-muted-foreground">Advanced data visualizations for your project</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  // Error state (show errors but allow partial data display)
  const errors = [
    trendError && { name: "Spending Trend", error: trendError, refetch: refetchTrend },
    budgetError && { name: "Budget Comparison", error: budgetError, refetch: refetchBudget },
    vendorError && { name: "Vendor Distribution", error: vendorError, refetch: refetchVendor },
    timelineError && { name: "Timeline", error: timelineError, refetch: refetchTimeline },
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
        <p className="text-muted-foreground">Advanced data visualizations for your project</p>
      </div>

      {/* Error alerts */}
      {hasError && errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((err) => {
            if (!err) return null
            return (
              <Alert key={err.name} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to load {err.name}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{err.error.message || "An error occurred"}</span>
                  <Button variant="outline" size="sm" onClick={() => err.refetch()}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )
          })}
        </div>
      )}

      {/* Visualization grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spending Trend Chart */}
        {!trendError && spendingTrend && (
          <SpendingTrendChart
            data={spendingTrend.map(
              (item: { date: string; amount: number; cumulativeAmount: number }) => ({
                date: item.date,
                amount: item.amount,
                cumulativeAmount: item.cumulativeAmount,
              })
            )}
            timeRange="daily"
          />
        )}

        {/* Budget Comparison Chart */}
        {!budgetError && (
          <BudgetComparisonChart
            data={
              budgetComparison
                ? {
                    budget: budgetComparison.budget,
                    spent: budgetComparison.spent,
                    variance: budgetComparison.variance,
                    percentageUsed: budgetComparison.percentageUsed,
                  }
                : null
            }
          />
        )}

        {/* Vendor Distribution Chart */}
        {!vendorError && vendorDistribution && (
          <VendorDistributionChart
            data={vendorDistribution.distribution.map(
              (item: {
                vendorId: string | null
                vendorName: string
                total: number
                percentage: number
              }) => ({
                vendorId: item.vendorId,
                vendorName: item.vendorName,
                total: item.total,
                percentage: item.percentage,
              })
            )}
            totalSpent={vendorDistribution.grandTotal}
          />
        )}

        {/* Project Timeline Chart */}
        {!timelineError && timeline && (
          <ProjectTimelineChart
            data={timeline.map(
              (item: {
                id: string
                title: string
                description: string | null
                date: Date | string
                categoryId: string
                categoryName: string | null
              }) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                date: new Date(item.date),
                categoryId: item.categoryId,
                categoryName: item.categoryName,
              })
            )}
          />
        )}
      </div>
    </div>
  )
}
