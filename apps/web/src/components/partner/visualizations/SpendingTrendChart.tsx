/**
 * SpendingTrendChart Component
 *
 * Story 4.4 - Data Visualizations
 *
 * Displays spending trend over time with cumulative totals:
 * - Line chart showing spending progression
 * - Time-series visualization with formatted dates
 * - Cumulative amount tracking
 * - Currency formatting (AUD with cents)
 *
 * Features:
 * - Responsive layout (mobile and desktop)
 * - Interactive chart with hover tooltips
 * - Empty state handling
 * - Smooth animations with Framer Motion
 * - Respects prefers-reduced-motion
 */

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"

export interface SpendingTrendData {
  date: string
  amount: number
  cumulativeAmount: number
}

export interface SpendingTrendChartProps {
  data: SpendingTrendData[]
  timeRange?: "daily" | "weekly" | "monthly"
}

export function SpendingTrendChart({ data, timeRange = "daily" }: SpendingTrendChartProps) {
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
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>Track your spending over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No spending data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Spending data will appear here as costs are added
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data with formatted dates
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM d"),
    fullDate: format(new Date(item.date), "PPP"),
  }))

  const totalSpent = data[data.length - 1]?.cumulativeAmount || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : 0.2,
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>
            Total spent: {formatCurrency(totalSpent)} over {data.length}{" "}
            {timeRange === "daily" ? "days" : timeRange === "weekly" ? "weeks" : "months"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full" data-testid="spending-trend-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={(value: number) => {
                    // Compact formatter for Y-axis (e.g., $1.2k instead of $1,234.56)
                    if (value >= 100000) {
                      return `$${(value / 100000).toFixed(1)}k`
                    }
                    return formatCurrency(value)
                  }}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Cumulative"]}
                  labelFormatter={(label: string, payload: unknown) => {
                    const typedPayload = payload as Array<{ fullDate?: string }>
                    return typedPayload[0]?.fullDate || label
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeAmount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={prefersReducedMotion ? 0 : 800}
                  animationBegin={0}
                  animationEasing="ease-out"
                  isAnimationActive={!prefersReducedMotion}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary info */}
          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-lg font-mono font-semibold">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average per Period</p>
              <p className="text-lg font-mono font-semibold">
                {formatCurrency(data.length > 0 ? totalSpent / data.length : 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
