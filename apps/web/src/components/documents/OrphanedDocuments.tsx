"use client"

import { useState } from "react"
import { Trash2, Link as LinkIcon, AlertTriangle } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ThumbnailImage } from "./ThumbnailImage"

/**
 * OrphanedDocuments component props
 */
interface OrphanedDocumentsProps {
  projectId: string
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
 * OrphanedDocuments - Display and manage documents with no entity links
 *
 * Shows documents that are not linked to any costs, events, or contacts.
 * Provides bulk operations for linking or deleting orphaned documents.
 * Helps users identify and clean up unused documents.
 *
 * @param projectId - Project ID to fetch orphaned documents from
 */
export function OrphanedDocuments({ projectId }: OrphanedDocumentsProps) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [entityType, setEntityType] = useState<"cost" | "event" | "contact">("cost")
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")

  // Fetch orphaned documents
  const { data: orphanedDocs, isLoading, refetch } = api.documents.listOrphaned.useQuery(projectId)

  // Fetch entities for linking
  const { data: costs } = api.costs.list.useQuery({ projectId })
  const { data: events } = api.events.list.useQuery({ projectId })
  const { data: contacts } = api.contacts.list.useQuery({ projectId })

  // Delete mutation
  const deleteMutation = api.documents.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedIds.size} document(s) deleted successfully`,
      })
      setSelectedIds(new Set())
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete documents",
        variant: "destructive",
      })
    },
  })

  // Link mutation
  const linkMutation = api.documents.linkToEntity.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedIds.size} document(s) linked successfully`,
      })
      setSelectedIds(new Set())
      setShowLinkDialog(false)
      setSelectedEntityId("")
      refetch()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link documents",
        variant: "destructive",
      })
    },
  })

  // Handle select all / deselect all
  const handleSelectAll = (checked: boolean) => {
    if (checked && orphanedDocs) {
      setSelectedIds(new Set(orphanedDocs.map((doc) => doc.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Handle individual checkbox toggle
  const handleToggle = (documentId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(documentId)) {
      newSet.delete(documentId)
    } else {
      newSet.add(documentId)
    }
    setSelectedIds(newSet)
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setShowDeleteDialog(false)

    // Delete each selected document
    for (const docId of Array.from(selectedIds)) {
      try {
        await deleteMutation.mutateAsync(docId)
      } catch (error) {
        console.error(`Failed to delete document ${docId}:`, error)
      }
    }
  }

  // Handle bulk link
  const handleBulkLink = async () => {
    if (!selectedEntityId) {
      toast({
        title: "Error",
        description: "Please select an entity to link to",
        variant: "destructive",
      })
      return
    }

    await linkMutation.mutateAsync({
      entityType,
      entityId: selectedEntityId,
      documentIds: Array.from(selectedIds),
    })
  }

  // Get entities for current entity type
  const getEntities = () => {
    switch (entityType) {
      case "cost":
        return costs || []
      case "event":
        return events?.events || []
      case "contact":
        return contacts || []
      default:
        return []
    }
  }

  const entities = getEntities()

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!orphanedDocs || orphanedDocs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <LinkIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No Orphaned Documents</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          All your documents are linked to costs, events, or contacts. Great job keeping things
          organized!
        </p>
      </div>
    )
  }

  const allSelected = orphanedDocs.length > 0 && selectedIds.size === orphanedDocs.length

  return (
    <div className="space-y-4">
      {/* Header with count badge and bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Orphaned Documents</h3>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {orphanedDocs.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
                disabled={linkMutation.isPending}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Warning message */}
      <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-orange-900 mb-1">Unlinked Documents</p>
          <p className="text-orange-700">
            These documents are not linked to any costs, events, or contacts. Consider linking them
            or deleting if no longer needed.
          </p>
        </div>
      </div>

      {/* Select all checkbox */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={handleSelectAll}
          aria-label="Select all orphaned documents"
        />
        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer select-none">
          Select All
        </label>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orphanedDocs.map((doc) => (
          <Card
            key={doc.id}
            className={`relative transition-all ${
              selectedIds.has(doc.id) ? "ring-2 ring-primary shadow-md" : ""
            }`}
          >
            <CardContent className="p-4">
              {/* Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedIds.has(doc.id)}
                  onCheckedChange={() => handleToggle(doc.id)}
                  aria-label={`Select ${doc.fileName}`}
                  className="bg-white shadow-sm"
                />
              </div>

              {/* Thumbnail */}
              <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                <ThumbnailImage
                  documentId={doc.id}
                  thumbnailUrl={doc.thumbnailUrl}
                  fileName={doc.fileName}
                  mimeType={doc.mimeType}
                />
              </div>

              {/* File info */}
              <div className="space-y-2">
                <p className="text-sm font-medium truncate" title={doc.fileName}>
                  {doc.fileName}
                </p>
                <div className="flex items-center justify-between">
                  <Badge className={getCategoryColor(doc.categoryId)}>
                    {getCategoryLabel(doc.categoryId)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Document(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected documents will be permanently deleted from
              the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link documents dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link {selectedIds.size} Document(s)</DialogTitle>
            <DialogDescription>
              Choose an entity to link the selected documents to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Entity Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select
                value={entityType}
                onValueChange={(value) => {
                  setEntityType(value as "cost" | "event" | "contact")
                  setSelectedEntityId("") // Reset selection when type changes
                }}
              >
                <SelectTrigger id="entity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Selection */}
            <div className="space-y-2">
              <Label htmlFor="entity">
                Select {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
              </Label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger id="entity">
                  <SelectValue placeholder={`Choose a ${entityType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {entities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No {entityType}s found</div>
                  ) : (
                    entities.map((entity) => {
                      // Get id and display text based on entity type
                      let entityId = ""
                      let displayText = ""

                      if (entityType === "cost" && "id" in entity && "description" in entity) {
                        entityId = entity.id as string
                        displayText = (entity.description as string) || ""
                      } else if (entityType === "event" && "id" in entity && "title" in entity) {
                        entityId = entity.id as string
                        displayText = (entity.title as string) || ""
                      } else if (entityType === "contact" && "contact" in entity) {
                        const contact = entity.contact as {
                          id: string
                          firstName: string
                          lastName: string | null
                        }
                        entityId = contact.id
                        displayText = `${contact.firstName} ${contact.lastName ?? ""}`
                      }

                      return (
                        <SelectItem key={entityId} value={entityId}>
                          {displayText}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false)
                setSelectedEntityId("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkLink} disabled={!selectedEntityId || linkMutation.isPending}>
              {linkMutation.isPending ? "Linking..." : "Link Documents"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
