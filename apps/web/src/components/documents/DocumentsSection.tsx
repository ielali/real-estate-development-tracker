"use client"

import { FileUpload, DocumentList, OrphanedDocuments } from "./index"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
 * Includes an "Orphaned Documents" tab to manage unlinked documents.
 */
export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const { toast } = useToast()
  const utils = api.useUtils()

  // Fetch orphaned documents count for badge
  const { data: orphanedDocs } = api.documents.listOrphaned.useQuery(projectId)
  const orphanedCount = orphanedDocs?.length || 0

  const handleUploadSuccess = (_documentId: string) => {
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    })
    // Refresh documents list after upload
    utils.documents.list.invalidate()
    utils.documents.listOrphaned.invalidate()
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

      {/* Tabbed interface for all documents and orphaned documents */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="orphaned" className="relative">
            Orphaned Documents
            {orphanedCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-100"
              >
                {orphanedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orphaned" className="mt-6">
          <OrphanedDocuments projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
