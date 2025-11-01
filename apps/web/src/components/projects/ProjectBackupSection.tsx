"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Download, FileJson, FileArchive, Info, AlertCircle, ExternalLink } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { useToast } from "@/hooks/use-toast"

interface ProjectBackupSectionProps {
  projectId: string
  projectName: string
}

/**
 * ProjectBackupSection - Project backup and export component
 *
 * Story 6.2: Provides two backup options:
 * - JSON backup: Metadata only (fast, small)
 * - ZIP backup: Full archive with documents (slower, larger)
 *
 * Features:
 * - Size estimation for ZIP backups
 * - Progress tracking for ZIP generation
 * - Rate limiting enforcement (5 JSON/hour, 2 ZIP/hour)
 * - Clear error messages
 */
export function ProjectBackupSection({
  projectId,
  projectName: _projectName,
}: ProjectBackupSectionProps) {
  const { toast } = useToast()
  const [isGeneratingJson, setIsGeneratingJson] = useState(false)
  const [isGeneratingZip, setIsGeneratingZip] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)

  // Fetch ZIP size estimate
  const { data: sizeEstimate, isLoading: isLoadingEstimate } =
    api.projects.estimateZipSize.useQuery(
      { projectId },
      {
        retry: false,
        // Don't refetch on window focus to avoid rate limiting
        refetchOnWindowFocus: false,
      }
    )

  // Generate backup mutation
  const generateBackupMutation = api.projects.generateBackup.useMutation({
    onError: (error: { message: string }) => {
      toast({
        title: "Backup failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  /**
   * Trigger browser download for a blob
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    console.log(`Attempting to download: ${filename}, size: ${blob.size} bytes, type: ${blob.type}`)

    if (blob.size === 0) {
      console.error("Blob is empty!")
      throw new Error("Downloaded file is empty")
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log("Download initiated successfully")
  }

  /**
   * Handle JSON backup download
   */
  const handleJsonBackup = async () => {
    setIsGeneratingJson(true)
    try {
      const result = await generateBackupMutation.mutateAsync({
        projectId,
        backupType: "json",
      })

      // Create JSON blob and trigger download
      const jsonString = JSON.stringify(result.backupData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      downloadBlob(blob, result.filename)

      toast({
        title: "Backup generated",
        description: `JSON backup downloaded successfully (${formatFileSize(result.fileSize)})`,
      })
    } catch (error) {
      // Error already handled by mutation onError
    } finally {
      setIsGeneratingJson(false)
    }
  }

  /**
   * Handle ZIP backup download
   */
  const handleZipBackup = async () => {
    setIsGeneratingZip(true)
    setZipProgress(0)

    try {
      // Simulate progress updates (actual progress tracking would require streaming)
      const progressInterval = setInterval(() => {
        setZipProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const result = await generateBackupMutation.mutateAsync({
        projectId,
        backupType: "zip",
      })

      clearInterval(progressInterval)
      setZipProgress(100)

      // Convert base64 to blob
      // Type assertion since we know this is a ZIP backup
      const zipResult = result as { zipData: string; filename: string; fileSize: number }

      if (!zipResult.zipData) {
        console.error("ZIP backup result:", result)
        throw new Error("No ZIP data returned from server")
      }

      const binaryString = atob(zipResult.zipData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: "application/zip" })
      downloadBlob(blob, zipResult.filename)

      toast({
        title: "Archive generated",
        description: `ZIP archive downloaded successfully (${formatFileSize(result.fileSize)})`,
      })
    } catch (error) {
      // Error already handled by mutation onError
    } finally {
      setIsGeneratingZip(false)
      setZipProgress(0)
    }
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Backup & Export</CardTitle>
        <CardDescription>
          Download a complete backup of your project data and documents
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Information Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Backup options:</strong> JSON includes metadata only (fast). ZIP includes all
            documents (may take 1-2 minutes for large projects).
            <br />
            <Link
              href="https://github.com/ielali/real-estate-development-tracker/blob/main/docs/guides/backup-restoration.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              View backup and restoration guide
              <ExternalLink className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>

        {/* JSON Backup Option */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">JSON Only</h3>
                <Badge variant="secondary">~50 KB</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Metadata only (fastest) - includes project details, costs, contacts, events
              </p>
            </div>
            <Button
              onClick={handleJsonBackup}
              disabled={isGeneratingJson || isGeneratingZip}
              className="shrink-0"
            >
              {isGeneratingJson ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ZIP Backup Option */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Full Archive</h3>
                {isLoadingEstimate ? (
                  <Badge variant="secondary">Calculating...</Badge>
                ) : sizeEstimate ? (
                  <>
                    <Badge variant="secondary">~{formatFileSize(sizeEstimate.estimatedSize)}</Badge>
                    {sizeEstimate.estimatedSize > 100 * 1024 * 1024 && (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Large download
                      </Badge>
                    )}
                  </>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {isLoadingEstimate
                  ? "Calculating size..."
                  : sizeEstimate
                    ? `With all documents (includes ${sizeEstimate.documentCount} files)`
                    : "With all documents"}
              </p>
              {sizeEstimate?.warningMessage && (
                <p className="text-sm text-amber-600">{sizeEstimate.warningMessage}</p>
              )}
            </div>
            <Button
              onClick={handleZipBackup}
              disabled={isGeneratingJson || isGeneratingZip || isLoadingEstimate}
              className="shrink-0"
            >
              {isGeneratingZip ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Packaging...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </>
              )}
            </Button>
          </div>

          {/* Progress bar for ZIP generation */}
          {isGeneratingZip && (
            <div className="space-y-2">
              <Progress value={zipProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {zipProgress < 100
                  ? `Packaging documents... ${zipProgress}%`
                  : "Download starting..."}
              </p>
            </div>
          )}
        </div>

        {/* Rate Limit Information */}
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Rate limits:</strong> 5 JSON backups or 2 ZIP backups per hour. Limits reset
            after one hour.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
