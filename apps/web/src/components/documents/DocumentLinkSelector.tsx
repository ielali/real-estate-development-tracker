"use client"

import { useState, useMemo } from "react"
import { Link as LinkIcon, Search, X } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ThumbnailImage } from "./ThumbnailImage"

/**
 * DocumentLinkSelector component props
 */
interface DocumentLinkSelectorProps {
  entityType: "cost" | "event" | "contact"
  entityId: string
  projectId: string
  onUpdate?: () => void
  children?: React.ReactNode
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
 * DocumentLinkSelector - Select and link documents to an entity
 *
 * Provides a searchable, filterable interface to select documents
 * to link to a cost, event, or contact. Shows currently linked
 * documents as pre-selected.
 *
 * @param entityType - Type of entity (cost, event, or contact)
 * @param entityId - ID of the entity
 * @param projectId - Project ID to fetch documents from
 * @param onUpdate - Optional callback after documents are linked
 * @param children - Trigger button content (defaults to "Link Documents")
 */
export function DocumentLinkSelector({
  entityType,
  entityId,
  projectId,
  onUpdate,
  children,
}: DocumentLinkSelectorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const utils = api.useUtils()

  // Fetch all project documents
  const { data: allDocuments, isLoading: isLoadingDocs } = api.documents.list.useQuery(
    { projectId, limit: 100 },
    { enabled: open }
  )

  // Fetch currently linked documents
  const { data: linkedDocuments, isLoading: isLoadingLinked } = api[
    entityType === "contact" ? "contacts" : entityType === "cost" ? "costs" : "events"
  ].getDocuments.useQuery(entityId, { enabled: open })

  // Link mutation
  const linkMutation = api.documents.linkToEntity.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Documents linked",
        description: `Successfully linked ${data.linksCreated} document(s).`,
      })
      // Invalidate queries to refresh
      void utils[
        entityType === "contact" ? "contacts" : entityType === "cost" ? "costs" : "events"
      ].getDocuments.invalidate()
      void utils.documents.list.invalidate()
      onUpdate?.()
      setOpen(false)
      setSearch("")
      setCategoryFilter("all")
      setSelectedDocs(new Set())
    },
    onError: (error) => {
      toast({
        title: "Failed to link documents",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Initialize selected docs with currently linked docs
  useMemo(() => {
    if (linkedDocuments && open) {
      setSelectedDocs(new Set(linkedDocuments.map((doc: { id: string }) => doc.id))) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [linkedDocuments, open])

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    if (!allDocuments?.documents) return []

    return allDocuments.documents.filter((doc: any) => {
      // eslint-disable-line @typescript-eslint/no-explicit-any
      const matchesSearch = doc.fileName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === "all" || doc.categoryId === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [allDocuments, search, categoryFilter])

  const handleToggleDocument = (documentId: string) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const handleSave = () => {
    // Determine which documents to link and unlink
    const linkedIds = new Set(linkedDocuments?.map((doc: { id: string }) => doc.id) || []) // eslint-disable-line @typescript-eslint/no-explicit-any
    const documentsToLink = Array.from(selectedDocs).filter((id) => !linkedIds.has(id))

    if (documentsToLink.length === 0) {
      toast({
        title: "No changes",
        description: "No new documents selected to link.",
      })
      setOpen(false)
      return
    }

    linkMutation.mutate({
      entityType,
      entityId,
      documentIds: documentsToLink,
    })
  }

  const isLoading = isLoadingDocs || isLoadingLinked

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <LinkIcon className="mr-2 h-4 w-4" />
            Link Documents
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Link Documents</DialogTitle>
          <DialogDescription>
            Select documents to link to this {entityType}. You can search and filter to find
            specific documents.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="space-y-4 border-b pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by filename..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="photos">Photos</SelectItem>
                  <SelectItem value="receipts">Receipts</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="contracts">Contracts</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="plans">Plans</SelectItem>
                  <SelectItem value="inspections">Inspections</SelectItem>
                  <SelectItem value="warranties">Warranties</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {selectedDocs.size} document{selectedDocs.size !== 1 ? "s" : ""} selected
            {filteredDocuments.length > 0 && ` · ${filteredDocuments.length} available`}
          </div>
        </div>

        {/* Document List */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-2">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-16 w-24 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            // Empty state
            <div className="py-12 text-center text-gray-500">
              <p>No documents found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          ) : (
            // Document list
            filteredDocuments.map((doc: any) => {
              // eslint-disable-line @typescript-eslint/no-explicit-any
              const isSelected = selectedDocs.has(doc.id)
              return (
                <Card
                  key={doc.id}
                  className={`cursor-pointer p-3 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleToggleDocument(doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleDocument(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Thumbnail */}
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
                      <ThumbnailImage
                        documentId={doc.id}
                        fileName={doc.fileName}
                        mimeType={doc.mimeType}
                        thumbnailUrl={doc.thumbnailUrl}
                      />
                    </div>

                    {/* Document Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <Badge className={`shrink-0 text-xs ${getCategoryColor(doc.categoryId)}`}>
                          {getCategoryLabel(doc.categoryId)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={linkMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={linkMutation.isPending || selectedDocs.size === 0}>
            {linkMutation.isPending ? "Linking..." : "Link Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
