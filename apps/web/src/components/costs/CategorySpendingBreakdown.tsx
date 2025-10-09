"use client"

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface CategorySpendingBreakdownProps {
  projectId: string
  startDate?: Date
  endDate?: Date
  showChart?: boolean
}

const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

/**
 * CategorySpendingBreakdown - Display category spending with tax breakdown
 *
 * Features:
 * - Hierarchical display (parent → children)
 * - Tax-deductible vs non-deductible subtotals
 * - Collapsible parent groups
 * - Pie chart visualization
 * - Empty state for no costs
 */
export function CategorySpendingBreakdown({
  projectId,
  startDate,
  endDate,
  showChart = true,
}: CategorySpendingBreakdownProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const {
    data: breakdown = [],
    isLoading,
    isError,
  } = api.category.getSpendingBreakdown.useQuery({
    projectId,
    startDate,
    endDate,
  })

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load category breakdown</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (breakdown.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2">No costs recorded</p>
        <p className="text-sm text-gray-500">Add costs to see spending by category</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = breakdown.map((group, index) => ({
    name: group.parentCategory.displayName,
    value: group.totalSpent / 100, // Convert to dollars
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  // Calculate grand totals
  const grandTotal = breakdown.reduce((sum, group) => sum + group.totalSpent, 0)
  const grandTaxDeductible = breakdown.reduce((sum, group) => sum + group.taxDeductibleTotal, 0)
  const grandNonDeductible = breakdown.reduce((sum, group) => sum + group.nonDeductibleTotal, 0)

  return (
    <div className="space-y-6">
      {/* Chart */}
      {showChart && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => {
                    const percent = typeof entry.percent === "number" ? entry.percent : 0
                    return `${entry.name}: ${(percent * 100).toFixed(1)}%`
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown List */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {breakdown.map((group) => {
            const isExpanded = expandedGroups.has(group.parentCategory.id)
            const hasTaxInfo = group.taxDeductibleTotal > 0 || group.nonDeductibleTotal > 0

            return (
              <div key={group.parentCategory.id} className="border rounded-lg">
                {/* Parent Category Header */}
                <button
                  onClick={() => toggleGroup(group.parentCategory.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold">{group.parentCategory.displayName}</div>
                      <div className="text-sm text-gray-600">
                        {group.childCategories.length} subcategories
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      $
                      {(group.totalSpent / 100).toLocaleString("en-AU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    {hasTaxInfo && (
                      <div className="text-xs text-gray-600 flex gap-2 justify-end mt-1">
                        {group.taxDeductibleTotal > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            Deductible: ${(group.taxDeductibleTotal / 100).toFixed(2)}
                          </Badge>
                        )}
                        {group.nonDeductibleTotal > 0 && (
                          <Badge variant="outline" className="text-gray-600">
                            Non-Deductible: ${(group.nonDeductibleTotal / 100).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Child Categories */}
                {isExpanded && (
                  <div className="border-t">
                    {group.childCategories.map((child) => (
                      <div
                        key={child.category.id}
                        className="p-4 pl-12 flex items-center justify-between hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div>
                          <div className="font-medium">{child.category.displayName}</div>
                          <div className="text-sm text-gray-600">
                            {child.costCount} {child.costCount === 1 ? "cost" : "costs"}
                            {child.category.taxDeductible !== null && (
                              <>
                                {" • "}
                                <Badge
                                  variant="outline"
                                  className={
                                    child.category.taxDeductible
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }
                                >
                                  {child.category.taxDeductible
                                    ? "Tax Deductible"
                                    : "Non-Deductible"}
                                </Badge>
                              </>
                            )}
                          </div>
                          {child.category.taxCategory && (
                            <div className="text-xs text-gray-500 mt-1">
                              ATO: {child.category.taxCategory.replace(/_/g, " ")}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold">
                          $
                          {(child.totalSpent / 100).toLocaleString("en-AU", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Grand Total Summary */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Spending</span>
              <span>
                $
                {(grandTotal / 100).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {(grandTaxDeductible > 0 || grandNonDeductible > 0) && (
              <div className="flex justify-end gap-4 mt-2 text-sm">
                {grandTaxDeductible > 0 && (
                  <div className="text-green-600">
                    Tax Deductible: ${(grandTaxDeductible / 100).toFixed(2)}
                  </div>
                )}
                {grandNonDeductible > 0 && (
                  <div className="text-gray-600">
                    Non-Deductible: ${(grandNonDeductible / 100).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
