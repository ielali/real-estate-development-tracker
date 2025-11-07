"use client"

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
import { useRouter } from "next/navigation"

interface TimelineDurationData {
  projectId: string
  projectName: string
  startDate: Date | null
  endDate: Date | null
  status: string
  durationDays: number | null
}

interface TimelineDurationChartProps {
  data: TimelineDurationData[]
}

const STATUS_COLORS = {
  active: "#3b82f6", // blue-500
  completed: "#10b981", // green-500
  "on-hold": "#f59e0b", // amber-500
}

export function TimelineDurationChart({ data }: TimelineDurationChartProps) {
  const router = useRouter()

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline Duration Comparison</CardTitle>
          <CardDescription>No timeline data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Projects with start and end dates will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data
    .map((item) => ({
      name: item.projectName,
      duration: item.durationDays || 0,
      projectId: item.projectId,
      status: item.status,
      startDate: item.startDate,
      endDate: item.endDate,
    }))
    .sort((a, b) => b.duration - a.duration)

  const handleBarClick = (data: any) => {
    if (data && data.projectId) {
      router.push(`/projects/${data.projectId}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Duration Comparison</CardTitle>
        <CardDescription>
          Comparing project durations for {data.length} {data.length === 1 ? "project" : "projects"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={(value) => `${value}d`} className="text-xs" />
            <YAxis dataKey="name" type="category" className="text-xs" />
            <Tooltip
              formatter={(value: number, name: string, props: { payload?: any }) => {
                const { payload } = props
                if (!payload) return [value, name]
                return [
                  <div key="tooltip" className="space-y-1">
                    <div>Duration: {value} days</div>
                    <div>Status: {payload.status}</div>
                    {payload.startDate && (
                      <div>Start: {new Date(payload.startDate).toLocaleDateString()}</div>
                    )}
                    {payload.endDate && (
                      <div>End: {new Date(payload.endDate).toLocaleDateString()}</div>
                    )}
                  </div>,
                  "",
                ]
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="duration" radius={[0, 4, 4, 0]} onClick={handleBarClick} cursor="pointer">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.active }} />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.completed }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_COLORS["on-hold"] }}
            />
            <span>On Hold</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
