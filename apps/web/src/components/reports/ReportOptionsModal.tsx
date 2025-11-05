"use client"

/**
 * Report Options Modal Component
 *
 * Provides a user interface for generating PDF and Excel reports.
 * Allows users to select report format, date range, and initiate
 * report generation with loading feedback.
 *
 * Features:
 * - Format selection (PDF/Excel)
 * - Date range picker with presets
 * - Loading state during generation
 * - Download button when report is ready
 * - Error handling with toast notifications
 */

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { api } from "@/lib/trpc/client"

/**
 * Form schema for report options
 */
const reportOptionsSchema = z.object({
  format: z.enum(["pdf", "excel"], {
    required_error: "Please select a report format",
  }),
  dateRangePreset: z.enum(["all", "last30", "lastQuarter", "ytd", "custom"], {
    required_error: "Please select a date range",
  }),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
})

type ReportOptionsForm = z.infer<typeof reportOptionsSchema>

/**
 * Date range preset options
 */
const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "last30", label: "Last 30 Days" },
  { value: "lastQuarter", label: "Last Quarter" },
  { value: "ytd", label: "Year to Date" },
] as const

/**
 * Calculate date range based on preset
 */
function getDateRangeFromPreset(preset: string): { start: Date | null; end: Date | null } {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  switch (preset) {
    case "all":
      return { start: null, end: null }
    case "last30":
      return { start: last30Days, end: now }
    case "lastQuarter":
      return { start: lastQuarter, end: now }
    case "ytd":
      return { start: startOfYear, end: now }
    default:
      return { start: null, end: null }
  }
}

interface ReportOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

/**
 * ReportOptionsModal Component
 *
 * Modal dialog for generating project reports with customizable options.
 * Handles report generation and download management.
 */
export function ReportOptionsModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ReportOptionsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [reportFileName, setReportFileName] = useState<string | null>(null)

  const form = useForm<ReportOptionsForm>({
    resolver: zodResolver(reportOptionsSchema),
    defaultValues: {
      format: "pdf",
      dateRangePreset: "all",
      startDate: null,
      endDate: null,
    },
  })

  const generateReportMutation = api.reports.generateReport.useMutation()

  /**
   * Watch for format changes and reset download state
   * This prevents showing stale download URLs when user switches formats
   */
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "format" && downloadUrl) {
        // Clear download state when format changes after report was generated
        setDownloadUrl(null)
        setReportFileName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, downloadUrl])

  /**
   * Handle form submission and report generation
   */
  const onSubmit = async (data: ReportOptionsForm) => {
    setIsGenerating(true)
    setDownloadUrl(null)
    setReportFileName(null)

    try {
      // Calculate date range from preset
      const dateRange = getDateRangeFromPreset(data.dateRangePreset)

      // Generate report
      const result = await generateReportMutation.mutateAsync({
        projectId,
        format: data.format,
        startDate: dateRange.start,
        endDate: dateRange.end,
      })

      // Set download URL and file name
      setDownloadUrl(result.downloadUrl)
      setReportFileName(result.fileName)

      toast.success(`${data.format.toUpperCase()} report generated successfully!`)
    } catch (error) {
      console.error("Report generation failed:", error)
      toast.error("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Handle download button click
   */
  const handleDownload = () => {
    if (downloadUrl) {
      // Open download URL in new tab
      window.open(downloadUrl, "_blank")
      toast.success("Report download started")
    }
  }

  /**
   * Handle modal close and reset state
   */
  const handleClose = () => {
    if (!isGenerating) {
      form.reset()
      setDownloadUrl(null)
      setReportFileName(null)
      onClose()
    }
  }

  const selectedFormat = form.watch("format")

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Create a professional financial report for {projectName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Format Selection */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Format</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                      disabled={isGenerating}
                    >
                      <Label
                        htmlFor="format-pdf"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                          field.value === "pdf" ? "border-primary" : ""
                        }`}
                      >
                        <RadioGroupItem value="pdf" id="format-pdf" className="sr-only" />
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="font-medium">PDF</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Professional report
                        </span>
                      </Label>

                      <Label
                        htmlFor="format-excel"
                        className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                          field.value === "excel" ? "border-primary" : ""
                        }`}
                      >
                        <RadioGroupItem value="excel" id="format-excel" className="sr-only" />
                        <FileSpreadsheet className="h-6 w-6 mb-2" />
                        <span className="font-medium">Excel</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Detailed workbook
                        </span>
                      </Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range Preset */}
            <FormField
              control={form.control}
              name="dateRangePreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isGenerating}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DATE_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-muted/30 p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">Generating report...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
                </div>
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && !isGenerating && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Report ready for download</span>
                </div>
                {reportFileName && (
                  <p className="text-xs text-muted-foreground">{reportFileName}</p>
                )}
                <Button type="button" onClick={handleDownload} className="w-full" variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  Download {selectedFormat.toUpperCase()} Report
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <DialogFooter>
              {!downloadUrl && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Report"}
                  </Button>
                </>
              )}
              {downloadUrl && (
                <Button type="button" variant="outline" onClick={handleClose}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
