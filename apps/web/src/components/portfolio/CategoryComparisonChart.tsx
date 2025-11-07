"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils/currency"
import { useRouter } from "next/navigation"

interface CategorySpendData {
  projectId: string
  projectName: string
  categoryId: string
  categoryName: string
  total: number
}

interface Project {
  id: string
  name: string
}

interface CategoryComparisonChartProps {
  data: CategorySpendData[]
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

export function CategoryComparisonChart({ data, projects }: CategoryComparisonChartProps) {
  const router = useRouter()

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Spend Comparison</CardTitle>
          <CardDescription>No category data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Cost data will appear here</p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for grouped bar chart
  // Group by category, with each project as a separate bar
  const categoryMap = new Map<string, { categoryName: string; [key: string]: any }>()

  data.forEach((item) => {
    if (!categoryMap.has(item.categoryId)) {
      categoryMap.set(item.categoryId, {
        categoryName: item.categoryName,
        categoryId: item.categoryId,
      })
    }
    const category = categoryMap.get(item.categoryId)!
    category[item.projectId] = item.total / 100 // Convert to dollars
  })

  const chartData = Array.from(categoryMap.values())

  const handleBarClick = (data: any, projectId: string) => {
    if (data && data.categoryId) {
      // Navigate to project details with category filter
      router.push(`/projects/${projectId}?category=${data.categoryId}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Spend Comparison</CardTitle>
        <CardDescription>
          Comparing spending across categories for {projects.length}{" "}
          {projects.length === 1 ? "project" : "projects"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="categoryName"
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} className="text-xs" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value * 100)}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {projects.map((project, index) => (
              <Bar
                key={project.id}
                dataKey={project.id}
                name={project.name}
                fill={COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
                onClick={(data) => handleBarClick(data, project.id)}
                cursor="pointer"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
