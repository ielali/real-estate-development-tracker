"use client"

import { FileUpload } from "./FileUpload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface DocumentsSectionProps {
  projectId: string
}

/**
 * DocumentsSection - Displays document upload interface for a project
 *
 * Provides file upload functionality and will display uploaded documents
 * in a list/grid view (to be implemented in Story 3.2).
 */
export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const { toast } = useToast()

  const handleUploadSuccess = (_documentId: string) => {
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    })
    // TODO: Refresh documents list when implemented in Story 3.2
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

      {/* Document list/grid will be added in Story 3.2 */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Document list and thumbnail view will be added in Story 3.2
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
