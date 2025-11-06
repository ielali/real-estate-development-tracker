"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface CostTrendData {
  projectId: string
  projectName: string
  month: string
  total: number
  count: number
}

interface Project {
  id: string
  name: string
}

interface CostTrendsChartProps {
  data: CostTrendData[]
  projects: Project[]
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

export function CostTrendsChart({ data, projects }: CostTrendsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends Over Time</CardTitle>
          <CardDescription>No cost trend data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Cost trends will appear here</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for line chart
  // Group by month, with each project as a separate line
  const monthMap = new Map<string, { month: string; [key: string]: any }>()

  data.forEach((item) => {
    if (!monthMap.has(item.month)) {
      monthMap.set(item.month, { month: item.month })
    }
    const monthData = monthMap.get(item.month)!
    monthData[item.projectId] = item.total / 100 // Convert to dollars
  })

  const chartData = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Trends Over Time</CardTitle>
        <CardDescription>
          Monthly spending trends across {projects.length}{" "}
          {projects.length === 1 ? "project" : "projects"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tickFormatter={(value) => {
                const [year, month] = value.split("-")
                return `${month}/${year.slice(2)}`
              }}
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} className="text-xs" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value * 100)}
              labelFormatter={(label) => {
                const [year, month] = label.split("-")
                return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {projects.map((project, index) => (
              <Line
                key={project.id}
                type="monotone"
                dataKey={project.id}
                name={project.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
