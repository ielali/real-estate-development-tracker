"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface CommonCategoryData {
  categoryId: string
  categoryName: string
  total: number
  count: number
  percentage: number
}

interface CommonCategoriesChartProps {
  data: CommonCategoryData[]
}

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

export function CommonCategoriesChart({ data }: CommonCategoriesChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Common Categories</CardTitle>
          <CardDescription>No category data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Category distribution will appear here</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.total / 100, // Convert to dollars
    count: item.count,
    percentage: item.percentage,
  }))

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Common Categories</CardTitle>
        <CardDescription>
          Portfolio-wide category distribution • Total: {formatCurrency(totalValue * 100)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: { payload: any }) => {
                  const { payload } = props
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div>Amount: {formatCurrency(value * 100)}</div>
                      <div>Transactions: {payload.count}</div>
                      <div>Percentage: {payload.percentage}%</div>
                    </div>,
                    payload.name,
                  ]
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-shrink-0 space-y-2">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 text-sm">
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(item.value * 100)} • {item.count} costs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
