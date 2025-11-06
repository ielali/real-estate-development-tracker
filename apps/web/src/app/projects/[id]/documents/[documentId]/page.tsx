"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, FileIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { CommentThread } from "@/components/comments/CommentThread"
import { ThumbnailImage } from "@/components/documents/ThumbnailImage"
import { useToast } from "@/hooks/use-toast"

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
 * Get category display name
 */
function getCategoryLabel(categoryId: string): string {
  const labels: Record<string, string> = {
    photos: "Photo",
    receipts: "Receipt",
    invoices: "Invoice",
    contracts: "Contract",
    permits: "Permit",
    plans: "Plan",
    inspections: "Inspection",
    warranties: "Warranty",
    correspondence: "Correspondence",
  }
  return labels[categoryId] || categoryId
}

/**
 * Get category color for badge
 */
function getCategoryColor(categoryId: string): string {
  const colors: Record<string, string> = {
    photos: "bg-blue-100 text-blue-800",
    receipts: "bg-green-100 text-green-800",
    invoices: "bg-yellow-100 text-yellow-800",
    contracts: "bg-purple-100 text-purple-800",
    permits: "bg-orange-100 text-orange-800",
    plans: "bg-indigo-100 text-indigo-800",
    inspections: "bg-red-100 text-red-800",
    warranties: "bg-teal-100 text-teal-800",
    correspondence: "bg-gray-100 text-gray-800",
  }
  return colors[categoryId] || "bg-gray-100 text-gray-800"
}

/**
 * Document Detail Page
 *
 * Displays full document details including:
 * - Document preview/thumbnail
 * - Document metadata (filename, size, category, upload date)
 * - Download functionality
 * - Comment thread for discussion
 *
 * Route: /projects/[id]/documents/[documentId]
 */
export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  if (!params) return null
  const projectId = params.id as string
  const documentId = params.documentId as string

  // Fetch project for breadcrumb and owner ID
  const { data: project, isLoading: projectLoading } = api.projects.getById.useQuery({
    id: projectId,
  })

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = api.documents.list.useQuery({
    projectId,
    limit: 1000,
  })

  const document = documentsData?.documents.find((d: any) => d.id === documentId) // eslint-disable-line @typescript-eslint/no-explicit-any

  const isLoading = projectLoading || documentsLoading

  const utils = api.useUtils()

  const handleDownload = async () => {
    if (!document) return

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
      const link = window.document.createElement("a")
      link.href = url
      link.download = result.fileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
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

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </>
    )
  }

  if (!project || !document) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">
              {!project ? "Project not found" : "Document not found"}
            </p>
            <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
          </div>
        </div>
      </>
    )
  }

  const breadcrumbItems = [
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${projectId}` },
    { label: "Documents", href: `/projects/${projectId}/documents` },
    { label: document.fileName },
  ]

  return (
    <>
      <Navbar />
      <div className="container max-w-4xl py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/documents` as never)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>

        {/* Document Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                  <CardTitle className="text-2xl">{document.fileName}</CardTitle>
                  <Badge variant="secondary" className={getCategoryColor(document.categoryId)}>
                    {getCategoryLabel(document.categoryId)}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {formatFileSize(document.fileSize)} • Uploaded{" "}
                  {new Date(document.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Document Preview */}
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <ThumbnailImage
                documentId={document.id}
                fileName={document.fileName}
                mimeType={document.mimeType}
                thumbnailUrl={document.thumbnailUrl}
              />
            </div>

            {/* Document Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
              <div>
                <span className="text-muted-foreground">File Type:</span>
                <p className="font-medium">{document.mimeType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-medium">{getCategoryLabel(document.categoryId)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <p className="font-medium">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Upload Date:</span>
                <p className="font-medium">
                  {new Date(document.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CommentThread
              entityType="document"
              entityId={documentId}
              projectId={projectId}
              projectOwnerId={project.ownerId}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
