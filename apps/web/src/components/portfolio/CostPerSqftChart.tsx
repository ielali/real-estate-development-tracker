"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"

interface CostPerSqftData {
  projectId: string
  projectName: string
  size: number | null
  totalCost: number
  costPerSqft: number | null
}

interface CostPerSqftChartProps {
  data: CostPerSqftData[]
}

export function CostPerSqftChart({ data }: CostPerSqftChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Per Square Meter</CardTitle>
          <CardDescription>No projects with size data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Add project size information to see cost per square meter analysis
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    name: item.projectName,
    costPerSqft: (item.costPerSqft || 0) / 100, // Convert cents to dollars
    totalCost: item.totalCost / 100,
    size: item.size,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Per Square Meter</CardTitle>
        <CardDescription>
          Comparing {data.length} {data.length === 1 ? "project" : "projects"} with size data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} className="text-xs" />
            <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]?.payload) return null
                const data = payload[0].payload
                return (
                  <div
                    style={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      padding: "8px",
                    }}
                  >
                    <div className="space-y-1 text-sm">
                      <div>Cost/m²: {formatCurrency(data.costPerSqft * 100)}</div>
                      <div>Total Cost: {formatCurrency(data.totalCost * 100)}</div>
                      <div>Size: {data.size?.toLocaleString()} m²</div>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="costPerSqft" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
