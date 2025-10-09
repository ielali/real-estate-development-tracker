"use client"

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { exportCategoryReport } from "@/lib/utils/category-export"

interface CategoryExportButtonProps {
  projectId: string
  projectName: string
  startDate?: Date
  endDate?: Date
  className?: string
}

/**
 * CategoryExportButton - Button component for exporting category reports
 *
 * Features:
 * - Generates CSV file for download
 * - Includes project metadata header
 * - Groups costs by category hierarchy
 * - Shows tax metadata for accountants
 * - Formats currency correctly (cents → dollars)
 */
export function CategoryExportButton({
  projectId,
  projectName: _projectName,
  startDate,
  endDate,
  className,
}: CategoryExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const { refetch } = api.category.getExportData.useQuery(
    {
      projectId,
      startDate,
      endDate,
    },
    {
      enabled: false, // Don't auto-fetch, only on button click
    }
  )

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const { data } = await refetch()

      if (!data) {
        throw new Error("Failed to fetch export data")
      }

      // Generate and download CSV
      exportCategoryReport(data)

      toast({
        title: "Success",
        description: "Category report exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" className={className}>
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export Category Report"}
    </Button>
  )
}
