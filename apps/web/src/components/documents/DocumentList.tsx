"use client"

import { useState } from "react"
import { Download, FileIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import type { Document } from "@/server/db/schema/documents"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ThumbnailImage } from "./ThumbnailImage"

/**
 * DocumentList component props
 */
interface DocumentListProps {
  projectId: string
  initialCategory?: string
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  return "Just now"
}

/**
 * Get category display name
 */
function getCategoryLabel(categoryId: string): string {
  const labels: Record<string, string> = {
    photo: "Photo",
    receipt: "Receipt",
    contract: "Contract",
    permit: "Permit",
  }
  return labels[categoryId] || categoryId
}

/**
 * Get category color for badge
 */
function getCategoryColor(categoryId: string): string {
  const colors: Record<string, string> = {
    photo: "bg-blue-100 text-blue-800",
    receipt: "bg-green-100 text-green-800",
    contract: "bg-purple-100 text-purple-800",
    permit: "bg-orange-100 text-orange-800",
  }
  return colors[categoryId] || "bg-gray-100 text-gray-800"
}

/**
 * DocumentList - Display project documents with filtering, sorting, and download
 *
 * Shows documents in a responsive grid layout with thumbnails, metadata,
 * and download functionality. Supports category filtering and sorting.
 *
 * @param projectId - Project ID to fetch documents for
 * @param initialCategory - Optional initial category filter
 */
export function DocumentList({ projectId, initialCategory }: DocumentListProps) {
  const { toast } = useToast()
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all")
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "name-asc" | "size-desc">(
    "date-desc"
  )

  // Fetch documents with filters
  const { data, isLoading, isError, refetch } = api.documents.list.useQuery({
    projectId,
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    sortBy,
    limit: 50,
  })

  /**
   * Handle document download
   */
  const utils = api.useUtils()

  const handleDownload = async (documentId: string) => {
    try {
      // Fetch document data via tRPC query
      const result = await utils.documents.download.fetch(documentId)

      // Convert base64 to blob
      const byteCharacters = atob(result.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.mimeType })

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: `Downloading ${result.fileName}`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Download failed"
      toast({
        title: "Download failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-64 animate-pulse bg-gray-100" />
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-4 text-gray-600">Failed to load documents</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </Card>
    )
  }

  const documents = data?.documents || []

  // Empty state
  if (documents.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
        <p className="text-gray-600">
          {categoryFilter === "all"
            ? "Upload your first document to get started"
            : "No documents in this category"}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Category:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="photo">Photos</SelectItem>
              <SelectItem value="receipt">Receipts</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="permit">Permits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="size-desc">Largest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Count */}
      <p className="text-sm text-gray-600">
        {documents.length} document{documents.length !== 1 ? "s" : ""}
      </p>

      {/* Document Grid */}
      <div
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        role="list"
        aria-label="Project documents"
      >
        {documents.map((doc: Document) => (
          <Card
            key={doc.id}
            className="group overflow-hidden transition-shadow hover:shadow-lg"
            role="listitem"
            aria-label={`${doc.fileName} - ${formatFileSize(doc.fileSize)} - ${formatRelativeTime(doc.createdAt)}`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square bg-gray-100">
              <ThumbnailImage
                documentId={doc.id}
                fileName={doc.fileName}
                mimeType={doc.mimeType}
                thumbnailUrl={doc.thumbnailUrl}
              />

              {/* Download button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(doc.id)}
                  aria-label={`Download ${doc.fileName}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2 p-3">
              <p className="truncate text-sm font-medium" title={doc.fileName}>
                {doc.fileName}
              </p>

              <div className="flex items-center justify-between gap-2">
                <Badge className={getCategoryColor(doc.categoryId)} variant="secondary">
                  {getCategoryLabel(doc.categoryId)}
                </Badge>
                <span className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</span>
              </div>

              <p className="text-xs text-gray-500">{formatRelativeTime(doc.createdAt)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
