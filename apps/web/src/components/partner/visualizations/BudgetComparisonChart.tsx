/**
 * BudgetComparisonChart Component
 *
 * Story 4.4 - Data Visualizations
 *
 * Displays budget vs actual spending comparison:
 * - Bar chart showing budget and actual spending
 * - Variance indicator (over/under budget)
 * - Color coding: green (under budget), red (over budget)
 * - Percentage usage calculation
 *
 * Features:
 * - Responsive layout (mobile and desktop)
 * - Animated bar fills
 * - Empty state when no budget is set
 * - Smooth animations with Framer Motion
 * - Respects prefers-reduced-motion
 */

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

export interface BudgetComparisonData {
  budget: number
  spent: number
  variance: number
  percentageUsed: number
}

export interface BudgetComparisonChartProps {
  data: BudgetComparisonData | null
}

export function BudgetComparisonChart({ data }: BudgetComparisonChartProps) {
  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Empty state (no budget set)
  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Budget Comparison</CardTitle>
          <CardDescription>Track budget vs actual spending</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No budget set</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set a project budget to track spending progress
          </p>
        </CardContent>
      </Card>
    )
  }

  // Determine status color
  const isOverBudget = data.variance < 0
  const statusColor = isOverBudget ? "#ef4444" : "#10b981" // red-500 : green-500

  // Prepare chart data
  const chartData = [
    {
      name: "Budget",
      amount: data.budget,
      fill: "#3b82f6", // blue-500
    },
    {
      name: "Spent",
      amount: data.spent,
      fill: statusColor,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        delay: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Budget Comparison</CardTitle>
          <CardDescription>
            {data.percentageUsed.toFixed(1)}% of budget used
            {isOverBudget ? " (Over budget)" : " (Under budget)"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tickFormatter={(value: number) => {
                    // Compact formatter for Y-axis
                    if (value >= 100000) {
                      return `$${(value / 100000).toFixed(1)}k`
                    }
                    return formatCurrency(value)
                  }}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar
                  dataKey="amount"
                  animationDuration={prefersReducedMotion ? 0 : 800}
                  animationBegin={0}
                  animationEasing="ease-out"
                  isAnimationActive={!prefersReducedMotion}
                  radius={[8, 8, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary info */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-lg font-mono font-semibold">{formatCurrency(data.budget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-lg font-mono font-semibold">{formatCurrency(data.spent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <p
                className={`text-lg font-mono font-semibold ${
                  isOverBudget ? "text-red-600" : "text-green-600"
                }`}
              >
                {isOverBudget ? "-" : "+"}
                {formatCurrency(Math.abs(data.variance))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
