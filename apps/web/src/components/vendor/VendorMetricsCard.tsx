"use client"

/**
 * VendorMetricsCard Component
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Displays vendor performance metrics on contact/vendor profile page
 * Features:
 * - Total projects, spent, average cost
 * - Frequency (projects per year)
 * - Last used date
 * - Average rating with stars
 * - Category specialization (top 3)
 * - Loading and empty states
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Calendar, Award } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { StarRating } from "./StarRating"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDistanceToNow } from "date-fns"

interface VendorMetricsCardProps {
  contactId: string
  hideHeader?: boolean
}

export function VendorMetricsCard({ contactId, hideHeader = false }: VendorMetricsCardProps) {
  const { data: metrics, isLoading, isError } = api.vendor.getVendorMetrics.useQuery(
    { contactId },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
          <CardDescription>Performance metrics and ratings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // If error or no data, it means the contact hasn't been used as a vendor yet
  if (isError || !metrics || metrics.totalProjects === 0) {
    return null // Don't show the card if there are no vendor metrics
  }

  return (
    <Card>
      {!hideHeader && (
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
          <CardDescription>Performance metrics and ratings</CardDescription>
        </CardHeader>
      )}
      <CardContent className={hideHeader ? "space-y-6" : "space-y-6"}>
        {/* Rating Summary */}
        {metrics.averageRating !== null && (
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Award className="h-8 w-8 text-yellow-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <StarRating value={metrics.averageRating} readonly size="md" />
                <span className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {metrics.ratingCount} rating{metrics.ratingCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Total Projects */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">{metrics.totalProjects}</p>
            </div>
          </div>

          {/* Total Spent */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</p>
            </div>
          </div>

          {/* Average Cost */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Average Cost</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.averageCost)}</p>
          </div>

          {/* Frequency */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Frequency</p>
            <p className="text-lg font-semibold">{metrics.frequency.toFixed(1)} / year</p>
          </div>
        </div>

        {/* Last Used */}
        {metrics.lastUsed && (
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium text-muted-foreground">Last Used</p>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <p className="text-sm">
                {formatDistanceToNow(new Date(metrics.lastUsed), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}

        {/* Category Specialization */}
        {metrics.categorySpecialization.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Category Specialization
            </p>
            <div className="space-y-2">
              {metrics.categorySpecialization.map((cat: { categoryId: string; categoryName: string; totalSpent: number }, index: number) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {cat.categoryName}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(cat.totalSpent)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
