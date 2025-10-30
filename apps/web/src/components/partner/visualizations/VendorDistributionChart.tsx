/**
 * VendorDistributionChart Component
 *
 * Story 4.4 - Data Visualizations
 *
 * Displays vendor spending distribution:
 * - Pie chart showing vendor spending breakdown
 * - Vendor name, total amount, and percentage
 * - Handles "Unassigned" category for costs without vendor
 * - Interactive chart with hover effects
 *
 * Features:
 * - Responsive layout (mobile and desktop)
 * - Professional color scheme with distinct colors
 * - Animated entry transitions
 * - Empty state handling
 * - Smooth animations with Framer Motion
 * - Respects prefers-reduced-motion
 */

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

export interface VendorDistributionItem {
  vendorId: string | null
  vendorName: string
  total: number
  percentage: number
}

export interface VendorDistributionChartProps {
  data: VendorDistributionItem[]
  totalSpent: number
}

// Color palette for vendors
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
]

export function VendorDistributionChart({ data, totalSpent }: VendorDistributionChartProps) {
  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vendor Distribution</CardTitle>
          <CardDescription>Spending breakdown by vendor</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No vendor data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vendor spending will appear here as costs are assigned to contacts
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data (limit to top 8 vendors, group rest as "Others")
  let chartData = data
  if (data.length > 8) {
    const topVendors = data.slice(0, 7)
    const othersTotal = data
      .slice(7)
      .reduce((sum: number, item: VendorDistributionItem) => sum + item.total, 0)
    const othersPercentage = data
      .slice(7)
      .reduce((sum: number, item: VendorDistributionItem) => sum + item.percentage, 0)

    chartData = [
      ...topVendors,
      {
        vendorId: null,
        vendorName: "Others",
        total: othersTotal,
        percentage: othersPercentage,
      },
    ]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : 0.4,
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vendor Distribution</CardTitle>
          <CardDescription>
            Total spent: {formatCurrency(totalSpent)} across {data.length}{" "}
            {data.length === 1 ? "vendor" : "vendors"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData as never}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={
                      ((props: { percent?: number }): string =>
                        `${((props.percent ?? 0) * 100).toFixed(0)}%`) as never
                    }
                    outerRadius={90}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="total"
                    animationBegin={0}
                    animationDuration={prefersReducedMotion ? 0 : 800}
                    isAnimationActive={!prefersReducedMotion}
                  >
                    {chartData.map((entry: VendorDistributionItem, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-3 gap-4 border-b bg-muted/50 p-3 text-sm font-medium">
                  <div>Vendor</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Percentage</div>
                </div>
                <div className="divide-y max-h-[240px] overflow-y-auto">
                  {chartData.map((item: VendorDistributionItem, index: number) => (
                    <motion.div
                      key={item.vendorId || `vendor-${index}`}
                      className="grid grid-cols-3 gap-4 p-3 text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.3,
                        delay: prefersReducedMotion ? 0 : index * 0.05,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium truncate">{item.vendorName}</span>
                      </div>
                      <div className="text-right font-mono">{formatCurrency(item.total)}</div>
                      <div className="text-right text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
