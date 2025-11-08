"use client"

/**
 * Vendor Performance Dashboard Page
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Displays comprehensive vendor performance dashboard with:
 * - Top-Rated Vendors (avg rating >= 4.0)
 * - Most-Used Vendors (by project count)
 * - Underutilized Vendors (high rating, low frequency)
 * - Recent Vendors (last 10 used)
 * - Vendor Spend Distribution (pie chart)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Spinner } from "@/components/ui/spinner"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { StarRating } from "@/components/vendor/StarRating"
import { Award, TrendingUp, AlertCircle, Clock, PieChart as PieChartIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export default function VendorDashboardPage() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = api.vendor.getVendorPerformanceDashboard.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    }
  )

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ErrorState
          message="Failed to load vendor dashboard"
          action={<Button onClick={() => refetch()}>Try Again</Button>}
        />
      </div>
    )
  }

  const hasData =
    data &&
    (data.topRatedVendors.length > 0 ||
      data.mostUsedVendors.length > 0 ||
      data.underutilizedVendors.length > 0 ||
      data.recentVendors.length > 0)

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[{ label: "Vendors", href: "/contacts" }, { label: "Performance Dashboard" }]}
        />
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Performance Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track vendor performance, ratings, and utilization across all projects
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/vendors/compare")}>
          Compare Vendors
        </Button>
      </div>

      {/* Empty State */}
      {!hasData && (
        <EmptyState
          title="No vendor data yet"
          description="Vendor performance metrics will appear here once you assign vendors to your projects and rate them"
        />
      )}

      {/* Dashboard Grid */}
      {hasData && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top-Rated Vendors */}
          {data.topRatedVendors.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Top-Rated Vendors</CardTitle>
                </div>
                <CardDescription>
                  Vendors with average rating of 4.0 stars or higher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topRatedVendors.map((v: any) => (
                    <div
                      key={v.vendor.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/vendors/${v.vendor.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {v.vendor.firstName} {v.vendor.lastName}
                        </p>
                        {v.vendor.company && (
                          <p className="text-sm text-muted-foreground">{v.vendor.company}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <StarRating value={v.averageRating || 0} readonly size="sm" />
                          <span className="text-sm text-muted-foreground">
                            ({v.ratingCount} {v.ratingCount === 1 ? "rating" : "ratings"})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(v.totalSpent)}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.totalProjects} {v.totalProjects === 1 ? "project" : "projects"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Most-Used Vendors */}
          {data.mostUsedVendors.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <CardTitle>Most-Used Vendors</CardTitle>
                </div>
                <CardDescription>Vendors ranked by number of projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.mostUsedVendors.map((v: any, index: number) => (
                    <div
                      key={v.vendor.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/vendors/${v.vendor.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">
                            {v.vendor.firstName} {v.vendor.lastName}
                          </p>
                          {v.vendor.company && (
                            <p className="text-sm text-muted-foreground">{v.vendor.company}</p>
                          )}
                          {v.averageRating !== null && (
                            <div className="mt-1">
                              <StarRating value={v.averageRating} readonly size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{v.totalProjects}</p>
                        <p className="text-xs text-muted-foreground">projects</p>
                        <p className="text-sm font-semibold">{formatCurrency(v.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Underutilized Vendors */}
          {data.underutilizedVendors.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <CardTitle>Underutilized Vendors</CardTitle>
                </div>
                <CardDescription>
                  High-rated vendors ({">"}= 4.0 stars) with low usage frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.underutilizedVendors.map((v: any) => (
                    <div
                      key={v.vendor.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/vendors/${v.vendor.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {v.vendor.firstName} {v.vendor.lastName}
                        </p>
                        {v.vendor.company && (
                          <p className="text-sm text-muted-foreground">{v.vendor.company}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <StarRating value={v.averageRating || 0} readonly size="sm" />
                        </div>
                      </div>
                      <div className="text-right">
                        {v.lastUsed && (
                          <p className="text-sm text-muted-foreground">
                            Last used{" "}
                            {formatDistanceToNow(new Date(v.lastUsed), { addSuffix: true })}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {v.frequency.toFixed(1)} projects/year
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Vendors */}
          {data.recentVendors.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <CardTitle>Recent Vendors</CardTitle>
                </div>
                <CardDescription>Last 10 vendors used in your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentVendors.map((v: any) => (
                    <div
                      key={v.vendor.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/vendors/${v.vendor.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {v.vendor.firstName} {v.vendor.lastName}
                        </p>
                        {v.vendor.company && (
                          <p className="text-sm text-muted-foreground">{v.vendor.company}</p>
                        )}
                        {v.averageRating !== null && (
                          <div className="mt-1">
                            <StarRating value={v.averageRating} readonly size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {v.lastUsed && (
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(v.lastUsed), { addSuffix: true })}
                          </p>
                        )}
                        <p className="text-sm font-semibold">{formatCurrency(v.totalSpent)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendor Spend Distribution Chart */}
          {data.vendorSpendDistribution.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-500" />
                  <CardTitle>Vendor Spend Distribution</CardTitle>
                </div>
                <CardDescription>Total spending breakdown by vendor (top 10)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.vendorSpendDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={(entry: any) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      >
                        {data.vendorSpendDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
