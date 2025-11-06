"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PortfolioFiltersProps {
  statusFilter: Array<"active" | "on_hold" | "completed">
  onStatusFilterChange: (filter: Array<"active" | "on_hold" | "completed">) => void
  dateRange: { start: Date; end: Date } | undefined
  onDateRangeChange: (range: { start: Date; end: Date } | undefined) => void
  disabled?: boolean
}

export function PortfolioFilters({
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  disabled = false,
}: PortfolioFiltersProps) {
  const toggleStatus = (status: "active" | "on_hold" | "completed") => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status))
    } else {
      onStatusFilterChange([...statusFilter, status])
    }
  }

  const clearAllFilters = () => {
    onStatusFilterChange([])
    onDateRangeChange(undefined)
  }

  const hasActiveFilters = statusFilter.length > 0 || dateRange !== undefined

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Additional Filters</CardTitle>
            <CardDescription>
              Filter data within selected projects by status or time period
            </CardDescription>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" disabled={disabled} onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Project Status</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Only include data from when selected projects had these statuses
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-active"
                  checked={statusFilter.includes("active")}
                  disabled={disabled}
                  onCheckedChange={() => toggleStatus("active")}
                />
                <Label
                  htmlFor="status-active"
                  className={`text-sm font-normal ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  Active
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-on-hold"
                  checked={statusFilter.includes("on_hold")}
                  disabled={disabled}
                  onCheckedChange={() => toggleStatus("on_hold")}
                />
                <Label
                  htmlFor="status-on-hold"
                  className={`text-sm font-normal ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  On Hold
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-completed"
                  checked={statusFilter.includes("completed")}
                  disabled={disabled}
                  onCheckedChange={() => toggleStatus("completed")}
                />
                <Label
                  htmlFor="status-completed"
                  className={`text-sm font-normal ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  Completed
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range Filter - Preset Options */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Time Period</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!dateRange ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                onClick={() => onDateRangeChange(undefined)}
              >
                All Time
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setDate(start.getDate() - 30)
                  onDateRangeChange({ start, end })
                }}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setMonth(start.getMonth() - 3)
                  onDateRangeChange({ start, end })
                }}
              >
                Last Quarter
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  const end = new Date()
                  const start = new Date(end.getFullYear(), 0, 1)
                  onDateRangeChange({ start, end })
                }}
              >
                Year to Date
              </Button>
            </div>
            {dateRange && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing data from {dateRange.start.toLocaleDateString()} to{" "}
                {dateRange.end.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
