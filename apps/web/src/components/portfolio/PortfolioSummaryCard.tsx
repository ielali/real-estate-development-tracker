"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { DollarSign, FolderOpen, TrendingUp } from "lucide-react"

interface PortfolioSummaryData {
  totalValue: number
  costCount: number
  projectCount: number
  avgPerProject: number
}

interface PortfolioSummaryCardProps {
  data: PortfolioSummaryData
}

export function PortfolioSummaryCard({ data }: PortfolioSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {data.projectCount} {data.projectCount === 1 ? "project" : "projects"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.projectCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.costCount} total {data.costCount === 1 ? "cost" : "costs"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average per Project</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.avgPerProject)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.projectCount > 0
              ? `${(data.costCount / data.projectCount).toFixed(1)} costs/project`
              : "No costs"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.costCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Entries recorded</p>
        </CardContent>
      </Card>
    </div>
  )
}
