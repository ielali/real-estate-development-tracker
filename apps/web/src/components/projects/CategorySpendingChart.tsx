"use client"

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
import { useTheme } from "next-themes"
import { getChartTheme, formatCurrencyTick, formatTooltipCurrency } from "@/lib/chart-utils"

/**
 * Budget status thresholds based on percentage of maximum spending
 * Used to determine color coding for categories
 */
const BUDGET_STATUS_THRESHOLDS = {
  /** On track: Less than 60% of maximum category spending */
  ON_TRACK: 60,
  /** Watch: 60-80% of maximum category spending */
  WATCH: 80,
  /** Warning: 80-95% of maximum category spending */
  WARNING: 95,
  /** Critical: 95%+ of maximum category spending */
  CRITICAL: 100,
} as const

/**
 * Status colors for budget status indicators
 * Separate light/dark mode colors for accessibility
 */
const STATUS_COLORS = {
  ON_TRACK: { light: "#16a34a", dark: "#22c55e", label: "On Track" }, // green
  WATCH: { light: "#ca8a04", dark: "#eab308", label: "Watch" }, // yellow
  WARNING: { light: "#ea580c", dark: "#fb923c", label: "Warning" }, // orange
  CRITICAL: { light: "#dc2626", dark: "#ef4444", label: "Critical" }, // red
} as const

/**
 * CategorySpendingChart Component
 *
 * Displays category spending with budget status indicators
 * Shows spending proportion and status (on track, warning, over)
 *
 * Features:
 * - Horizontal bar chart with status colors
 * - Green: Low spending (< 60% of max)
 * - Yellow: Medium spending (60-80% of max)
 * - Orange: High spending (80-95% of max)
 * - Red: Very high spending (> 95% of max)
 * - Tooltips with amounts and percentages
 * - Dark mode support
 * - Responsive sizing
 * - Accessible with ARIA labels
 */

export interface CategoryData {
  category: string
  categoryId: string
  total: number
  count: number
}

export interface CategorySpendingChartProps {
  /**
   * Category spending data
   */
  data: CategoryData[]
  /**
   * Chart height in pixels (default: 300)
   */
  height?: number
}

export function CategorySpendingChart({ data, height = 300 }: CategorySpendingChartProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark")
  const chartTheme = getChartTheme(isDark)

  // Sort data by total spending (descending)
  const sortedData = [...data].sort((a, b) => b.total - a.total)

  // Find max spending for relative comparison
  const maxSpending = Math.max(...sortedData.map((item) => item.total), 1)

  // Prepare chart data with status colors
  const chartData = sortedData.map((item) => {
    const percentage = (item.total / maxSpending) * 100

    // Determine status color based on spending level using defined thresholds
    let statusConfig: (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS]

    if (percentage < BUDGET_STATUS_THRESHOLDS.ON_TRACK) {
      statusConfig = STATUS_COLORS.ON_TRACK
    } else if (percentage < BUDGET_STATUS_THRESHOLDS.WATCH) {
      statusConfig = STATUS_COLORS.WATCH
    } else if (percentage < BUDGET_STATUS_THRESHOLDS.WARNING) {
      statusConfig = STATUS_COLORS.WARNING
    } else {
      statusConfig = STATUS_COLORS.CRITICAL
    }

    return {
      category: item.category,
      amount: item.total,
      percentage: percentage.toFixed(1),
      statusColor: isDark ? statusConfig.dark : statusConfig.light,
      status: statusConfig.label,
    }
  })

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-500 dark:text-slate-400 text-sm">No cost data available</p>
      </div>
    )
  }

  return (
    <div role="img" aria-label="Category budget status bar chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.gridColor}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type="number"
            tickFormatter={formatCurrencyTick}
            stroke={chartTheme.textColor}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
            }}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke={chartTheme.textColor}
            width={110}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                    style={{
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{item.category}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Amount: {formatTooltipCurrency(item.amount)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Status: <span style={{ color: item.statusColor }}>{item.status}</span>
                    </p>
                  </div>
                )
              }
              return null
            }}
            cursor={{ fill: isDark ? "rgba(100, 116, 139, 0.1)" : "rgba(226, 232, 240, 0.5)" }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.statusColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
