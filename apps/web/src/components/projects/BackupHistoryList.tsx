"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileJson, FileArchive } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { formatDistanceToNow } from "date-fns"

interface BackupHistoryListProps {
  projectId: string
}

/**
 * BackupHistoryList - Display recent project backups
 *
 * Story 6.2: Shows last 10 backups with:
 * - Backup type (JSON/ZIP)
 * - Creation date
 * - File size
 * - Document count (for ZIP backups)
 * - Schema version
 */
export function BackupHistoryList({ projectId }: BackupHistoryListProps) {
  const { data: backups, isLoading } = api.projects.getBackupHistory.useQuery(
    { projectId },
    {
      // Don't refetch on window focus to avoid excessive requests
      refetchOnWindowFocus: false,
    }
  )

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Loading backup history...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!backups || backups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>No backups have been created yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create your first backup using the options above. Your backup history will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup History</CardTitle>
        <CardDescription>Recent backups for this project (last 10)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Version</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup: any) => (
              <TableRow key={backup.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {backup.backupType === "json" ? (
                      <>
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <Badge variant="secondary">JSON</Badge>
                      </>
                    ) : (
                      <>
                        <FileArchive className="h-4 w-4 text-green-500" />
                        <Badge variant="default">ZIP</Badge>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(backup.createdAt)}
                </TableCell>
                <TableCell className="text-sm">{formatFileSize(backup.fileSize)}</TableCell>
                <TableCell className="text-sm">
                  {backup.documentCount > 0 ? backup.documentCount : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {backup.schemaVersion}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
