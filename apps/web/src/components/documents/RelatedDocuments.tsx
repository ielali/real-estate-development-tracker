"use client"

import { Download, X, FileIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ThumbnailImage } from "./ThumbnailImage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

/**
 * RelatedDocuments component props
 */
interface RelatedDocumentsProps {
  entityType: "cost" | "event" | "contact"
  entityId: string
  onUpdate?: () => void
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
 * RelatedDocuments - Display and manage documents linked to an entity
 *
 * Shows a grid of documents linked to a cost, event, or contact.
 * Supports downloading and unlinking documents.
 *
 * @param entityType - Type of entity (cost, event, or contact)
 * @param entityId - ID of the entity
 * @param onUpdate - Optional callback after document unlink
 */
export function RelatedDocuments({ entityType, entityId, onUpdate }: RelatedDocumentsProps) {
  const { toast } = useToast()
  const [documentToUnlink, setDocumentToUnlink] = useState<string | null>(null)
  const utils = api.useUtils()

  // Fetch linked documents based on entity type
  const { data: documents, isLoading } =
    api[
      entityType === "contact" ? "contacts" : entityType === "cost" ? "costs" : "events"
    ].getDocuments.useQuery(entityId)

  // Unlink mutation
  const unlinkMutation = api.documents.unlinkFromEntity.useMutation({
    onSuccess: () => {
      toast({
        title: "Document unlinked",
        description: "The document has been unlinked successfully.",
      })
      // Invalidate the query to refresh the list
      void utils[
        entityType === "contact" ? "contacts" : entityType === "cost" ? "costs" : "events"
      ].getDocuments.invalidate()
      onUpdate?.()
      setDocumentToUnlink(null)
    },
    onError: (error) => {
      toast({
        title: "Failed to unlink document",
        description: error.message,
        variant: "destructive",
      })
      setDocumentToUnlink(null)
    },
  })

  const handleUnlink = (documentId: string) => {
    unlinkMutation.mutate({
      entityType,
      entityId,
      documentIds: [documentId],
    })
  }

  const handleDownload = async (documentId: string) => {
    try {
      const data = await utils.client.documents.download.query(documentId)

      // Convert base64 to blob and trigger download
      const byteCharacters = atob(data.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = data.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: `Downloading ${data.fileName}`,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <FileIcon className="h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No linked documents</h3>
        <p className="mt-2 text-sm text-gray-500">
          No documents are currently linked to this {entityType}.
        </p>
        <p className="mt-1 text-sm text-gray-500">Click "Link Documents" to add some.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map(
          (doc: {
            id: string
            fileName: string
            mimeType: string
            thumbnailUrl: string | null
            categoryId: string
            fileSize: number
          }) => (
            <Card
              key={doc.id}
              className="group relative overflow-hidden p-4 transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <ThumbnailImage
                  documentId={doc.id}
                  fileName={doc.fileName}
                  mimeType={doc.mimeType}
                  thumbnailUrl={doc.thumbnailUrl}
                />
              </div>

              {/* Document Info */}
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className="line-clamp-2 text-sm font-medium text-gray-900"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </h4>
                  <Badge className={`shrink-0 text-xs ${getCategoryColor(doc.categoryId)}`}>
                    {getCategoryLabel(doc.categoryId)}
                  </Badge>
                </div>

                <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(doc.id)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentToUnlink(doc.id)}
                    disabled={unlinkMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        )}
      </div>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!documentToUnlink} onOpenChange={() => setDocumentToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this document and the {entityType}. The document
              will not be deleted and can be linked again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => documentToUnlink && handleUnlink(documentToUnlink)}
              className="bg-red-600 hover:bg-red-700"
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
