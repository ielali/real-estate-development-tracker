"use client"

import { FileUpload, DocumentList } from "./index"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/trpc/client"

interface DocumentsSectionProps {
  projectId: string
}

/**
 * DocumentsSection - Displays document upload interface and document list for a project
 *
 * Provides file upload functionality with automatic categorization
 * and displays uploaded documents in a grid view with filtering and sorting.
 */
export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const { toast } = useToast()
  const utils = api.useUtils()

  const handleUploadSuccess = (_documentId: string) => {
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    })
    // Refresh documents list after upload
    utils.documents.list.invalidate()
  }

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            projectId={projectId}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
          />
        </CardContent>
      </Card>

      {/* Document list with thumbnails */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  )
}
