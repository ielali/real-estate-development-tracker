"use client"

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"
import { useTheme } from "next-themes"
import {
  getChartTheme,
  formatCurrencyTick,
  formatTooltipCurrency,
  formatMonthLabel,
} from "@/lib/chart-utils"

/**
 * SpendingTrendChart Component
 *
 * Displays cumulative spending over time as a line/area chart
 * Shows spending progression with budget reference line
 *
 * Features:
 * - Cumulative spending line
 * - Budget reference line (if provided)
 * - Area fill under line
 * - Month labels on X-axis
 * - Tooltips with amounts and budget status
 * - Dark mode support
 * - Responsive sizing
 * - Accessible with ARIA labels
 */

export interface MonthlyData {
  month: string // YYYY-MM format
  monthTotal: number // Spending in this month (cents)
  cumulative: number // Cumulative spending up to this month (cents)
}

export interface SpendingTrendChartProps {
  /**
   * Monthly spending data
   */
  data: MonthlyData[]
  /**
   * Total project budget for reference line (cents)
   */
  totalBudget?: number | null
  /**
   * Chart height in pixels (default: 300)
   */
  height?: number
}

export function SpendingTrendChart({ data, totalBudget, height = 300 }: SpendingTrendChartProps) {
  const { theme, systemTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark")
  const chartTheme = getChartTheme(isDark)

  // Prepare chart data with formatted months
  const chartData = data.map((item) => ({
    month: formatMonthLabel(item.month),
    monthLabel: item.month,
    cumulative: item.cumulative,
    monthTotal: item.monthTotal,
  }))

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-500 dark:text-slate-400 text-sm">No spending data available</p>
      </div>
    )
  }

  return (
    <div role="img" aria-label="Spending trend over time line chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isDark ? "#60a5fa" : "#3b82f6"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
          <XAxis
            dataKey="month"
            stroke={chartTheme.textColor}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
            }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={formatCurrencyTick}
            stroke={chartTheme.textColor}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const isOverBudget = totalBudget && totalBudget > 0 && data.cumulative > totalBudget
                return (
                  <div
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                    style={{
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{data.month}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Month Total: {formatTooltipCurrency(data.monthTotal)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Cumulative: {formatTooltipCurrency(data.cumulative)}
                    </p>
                    {totalBudget && totalBudget > 0 && (
                      <p
                        className={`text-sm mt-1 ${isOverBudget ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                      >
                        {isOverBudget ? "⚠️ Over budget" : "✓ Within budget"}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          {/* Budget reference line */}
          {totalBudget && totalBudget > 0 && (
            <ReferenceLine
              y={totalBudget}
              stroke={isDark ? "#f87171" : "#ef4444"}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "Budget",
                position: "insideTopRight",
                fill: isDark ? "#f87171" : "#ef4444",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}
          {/* Area under the line */}
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="none"
            fill="url(#cumulativeGradient)"
          />
          {/* Cumulative spending line */}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke={isDark ? "#60a5fa" : "#3b82f6"}
            strokeWidth={3}
            dot={{ fill: isDark ? "#60a5fa" : "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
            name="Cumulative Spending"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
