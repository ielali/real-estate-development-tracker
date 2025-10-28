/**
 * DocumentGallery Component
 *
 * Story 4.3 - Partner Dashboard
 *
 * Displays documents grouped by category:
 * - Thumbnail for images
 * - File icons for other types
 * - File name, size, and upload date
 * - Category filtering with tabs
 * - Lightbox for full-size view
 *
 * Features:
 * - Responsive grid layout (2 cols mobile, 3-4 tablet, 4-6 desktop)
 * - Category tabs for filtering
 * - Click to view full-size or download
 * - Empty state handling
 * - Framer Motion animations
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  X,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export interface DocumentItem {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  blobUrl: string
  thumbnailUrl: string | null
  categoryName: string
  uploadedBy: string
  uploadedAt: Date
}

export interface DocumentGalleryProps {
  documents: DocumentItem[]
}

// Get file icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-8 w-8" />
  if (mimeType.includes("pdf")) return <FileText className="h-8 w-8" />
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="h-8 w-8" />
  }
  if (mimeType.startsWith("video/")) return <FileVideo className="h-8 w-8" />
  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return <FileArchive className="h-8 w-8" />
  }
  return <File className="h-8 w-8" />
}

// Format file size
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Group documents by category
function groupDocumentsByCategory(documents: DocumentItem[]) {
  const groups: Record<string, DocumentItem[]> = {}

  documents.forEach((doc) => {
    if (!groups[doc.categoryName]) {
      groups[doc.categoryName] = []
    }
    groups[doc.categoryName].push(doc)
  })

  return groups
}

export function DocumentGallery({ documents }: DocumentGalleryProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Empty state
  if (documents.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Document Gallery</CardTitle>
          <CardDescription>Project documents and files</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Documents will appear here once they are uploaded
          </p>
        </CardContent>
      </Card>
    )
  }

  const groupedDocuments = groupDocumentsByCategory(documents)
  const categories = ["all", ...Object.keys(groupedDocuments)]
  const filteredDocuments =
    selectedCategory === "all" ? documents : groupedDocuments[selectedCategory] || []

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Document Gallery</CardTitle>
            <CardDescription>
              {documents.length} {documents.length === 1 ? "document" : "documents"} across{" "}
              {Object.keys(groupedDocuments).length}{" "}
              {Object.keys(groupedDocuments).length === 1 ? "category" : "categories"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="mb-6 w-full justify-start overflow-x-auto flex-wrap h-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category === "all"
                      ? `All (${documents.length})`
                      : `${category} (${groupedDocuments[category]?.length || 0})`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    <AnimatePresence>
                      {filteredDocuments.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group relative cursor-pointer"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Card className="overflow-hidden transition-all hover:shadow-md hover:scale-105">
                            <CardContent className="p-3 space-y-2">
                              {/* Thumbnail or Icon */}
                              <div className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                {doc.thumbnailUrl && doc.mimeType.startsWith("image/") ? (
                                  <img
                                    src={doc.thumbnailUrl}
                                    alt={doc.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-muted-foreground">
                                    {getFileIcon(doc.mimeType)}
                                  </div>
                                )}
                              </div>

                              {/* File Info */}
                              <div className="space-y-1">
                                <p
                                  className="text-xs font-medium line-clamp-2"
                                  title={doc.fileName}
                                >
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.fileSize)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Empty state for filtered view */}
                  {filteredDocuments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No documents in {category === "all" ? "any category" : category}
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start justify-between gap-4">
                  <span className="flex-1">{selectedDocument.fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDocument(null)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Document Preview */}
                <div className="rounded-lg border bg-muted/50 min-h-[400px] flex items-center justify-center overflow-hidden">
                  {selectedDocument.mimeType.startsWith("image/") ? (
                    <img
                      src={selectedDocument.blobUrl}
                      alt={selectedDocument.fileName}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  ) : (
                    <div className="text-center p-8 space-y-4">
                      <div className="text-muted-foreground flex justify-center">
                        {getFileIcon(selectedDocument.mimeType)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Preview not available for this file type
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium capitalize">{selectedDocument.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{formatFileSize(selectedDocument.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded by:</span>
                    <span className="font-medium">{selectedDocument.uploadedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(selectedDocument.uploadedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={selectedDocument.blobUrl} download={selectedDocument.fileName}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <a href={selectedDocument.blobUrl} target="_blank" rel="noopener noreferrer">
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
