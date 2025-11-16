"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useTheme } from "next-themes"
import { getChartTheme, getCategoryColor, formatTooltipCurrency } from "@/lib/chart-utils"

/**
 * CostBreakdownChart Component
 *
 * Displays cost distribution across categories as a pie/doughnut chart
 * Shows percentage breakdown and amount tooltips
 *
 * Features:
 * - Interactive pie chart with hover effects
 * - Category-specific colors
 * - Percentage labels
 * - Tooltips with amounts
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

export interface CostBreakdownChartProps {
  /**
   * Category spending data
   */
  data: CategoryData[]
  /**
   * Chart height in pixels (default: 300)
   */
  height?: number
}

export function CostBreakdownChart({ data, height = 300 }: CostBreakdownChartProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark")
  const chartTheme = getChartTheme(isDark)

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.total, 0)

  // Prepare chart data with percentages
  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total,
    percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : "0.0",
  }))

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
    <div role="img" aria-label="Cost breakdown by category pie chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="42%"
            labelLine={false}
            label={({ percentage, name }) => `${name}: ${percentage}%`}
            outerRadius={Math.min(height / 3.5, 85)}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getCategoryColor(entry.name, isDark)}
                stroke={chartTheme.backgroundColor}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                    style={{
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{data.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Amount: {formatTooltipCurrency(data.value)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Percentage: {data.percentage}%
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: chartTheme.textColor,
              paddingTop: "24px",
            }}
            formatter={(value: string) => (
              <span style={{ color: chartTheme.textColor, fontSize: "12px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
