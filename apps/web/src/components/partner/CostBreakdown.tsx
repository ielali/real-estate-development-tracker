/**
 * CostBreakdown Component
 *
 * Story 4.3 - Partner Dashboard
 *
 * Displays cost breakdown by category with visualizations:
 * - Pie/Donut chart showing category distribution
 * - Table with category name, amount, and percentage
 * - Animated transitions
 * - Currency formatting (AUD with cents)
 *
 * Features:
 * - Responsive layout (chart above table on mobile, side-by-side on desktop)
 * - Interactive chart with hover effects
 * - Empty state handling
 * - Framer Motion animations
 */

"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

export interface CostBreakdownItem {
  categoryId: string
  categoryName: string
  total: number
  percentage: number
}

export interface CostBreakdownProps {
  data: CostBreakdownItem[]
  totalSpent: number
}

// Color palette for categories
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

export function CostBreakdown({ data, totalSpent }: CostBreakdownProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Distribution of costs by category</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No costs recorded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cost data will appear here once expenses are added
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for chart
  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.total,
    percentage: item.percentage,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>
            Total spent: {formatCurrency(totalSpent)} across {data.length}{" "}
            {data.length === 1 ? "category" : "categories"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage.toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
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
                  <div>Category</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Percentage</div>
                </div>
                <div className="divide-y">
                  {data.map((item, index) => (
                    <motion.div
                      key={item.categoryId}
                      className="grid grid-cols-3 gap-4 p-3 text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{item.categoryName}</span>
                      </div>
                      <div className="text-right font-mono">{formatCurrency(item.total)}</div>
                      <div className="text-right text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span className="font-mono text-lg">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
