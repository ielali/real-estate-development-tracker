"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Pencil, Trash2, UserPlus, MessageSquare } from "lucide-react"
import { CostListSkeleton } from "@/components/skeletons/cost-list-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ContactSelector } from "./ContactSelector"
import { CostImport } from "./CostImport"
import type { CostFilters, SortOption, SortDirection } from "@/lib/utils/cost-filters"

interface CostsListProps {
  projectId: string
  filters?: CostFilters
  searchText?: string
  sortBy?: SortOption
  sortDirection?: SortDirection
  showSearch?: boolean
  highlightCostId?: string // For notification navigation (Story 8.1)
}

interface CostItemProps {
  cost: any
  projectId: string
  isHighlighted: boolean
  isSelected: boolean
  onToggleSelection: () => void
  onDelete: () => void
  highlightedCostRef: React.RefObject<HTMLDivElement> | null
}

/**
 * CostItem - Individual cost row with comment count
 */
function CostItem({
  cost,
  projectId,
  isHighlighted,
  isSelected,
  onToggleSelection,
  onDelete,
  highlightedCostRef,
}: CostItemProps) {
  // Fetch comment count for this cost
  const { data: commentCount = 0 } = api.comments.getCount.useQuery({
    entityType: "cost",
    entityId: cost.id,
  })

  return (
    <div
      ref={highlightedCostRef}
      className={`flex items-center gap-3 py-3 border-b last:border-b-0 transition-all ${
        isHighlighted ? "bg-primary/10 border-primary/30 rounded-md px-2 -mx-2 shadow-sm" : ""
      }`}
    >
      <Checkbox
        id={`cost-${cost.id}`}
        checked={isSelected}
        onCheckedChange={onToggleSelection}
        aria-label={`Select ${cost.description}`}
      />
      <div className="flex-1 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{cost.description}</span>
            {cost.category && (
              <Badge variant="outline" className="text-xs">
                {cost.category.displayName}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{new Date(cost.date).toLocaleDateString()}</span>
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">
              {new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
              }).format(cost.amount / 100)}
            </p>
          </div>
          <div className="flex gap-1">
            <Link href={`/projects/${projectId}/costs/${cost.id}/edit` as never}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * CostsList - Lazy-loaded component for displaying project costs
 *
 * Shows list of all costs with edit/delete actions and running total
 * Loads data independently from parent component
 * Supports bulk contact assignment via checkboxes
 * Supports search, filters, and sorting (Story 2.4)
 */
export function CostsList({
  projectId,
  filters = {},
  searchText = "",
  sortBy = "date",
  sortDirection = "desc",
  highlightCostId,
}: CostsListProps) {
  const [costToDelete, setCostToDelete] = useState<string | null>(null)
  const [selectedCostIds, setSelectedCostIds] = useState<Set<string>>(new Set())
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const utils = api.useUtils()
  const highlightedCostRef = useRef<HTMLDivElement>(null)

  // Build query input (needed for cache key matching)
  const queryInput = {
    projectId,
    ...filters,
    searchText: searchText || undefined,
    sortBy,
    sortDirection,
  }

  // Fetch costs for this project with filters
  const { data: costsData, isLoading: costsLoading } = api.costs.list.useQuery(queryInput)

  // Scroll to highlighted cost when component mounts (Story 8.1 - notification navigation)
  useEffect(() => {
    if (highlightCostId && highlightedCostRef.current) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        highlightedCostRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)
    }
  }, [highlightCostId, costsData])

  // Calculate total costs
  const totalCosts = costsData?.reduce((sum: number, cost: any) => sum + cost.amount, 0) ?? 0

  const deleteCostMutation = api.costs.softDelete.useMutation({
    // Optimistic update: Remove cost from UI immediately
    onMutate: async (variables) => {
      // Cancel outgoing refetches (use exact query key)
      await utils.costs.list.cancel(queryInput)

      // Snapshot the previous value (use exact query key)
      const previousCosts = utils.costs.list.getData(queryInput)

      // Optimistically update to remove the cost (use exact query key)
      if (previousCosts) {
        utils.costs.list.setData(
          queryInput,
          previousCosts.filter((cost: any) => cost.id !== variables.id)
        )
      }

      // Return context with previous data for rollback
      return { previousCosts }
    },
    onSuccess: () => {
      toast.success("Cost deleted successfully")
      void utils.costs.list.invalidate(queryInput)
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error (use exact query key)
      if (context?.previousCosts) {
        utils.costs.list.setData(queryInput, context.previousCosts)
      }
      toast.error(error.message || "Failed to delete cost")
    },
  })

  const handleDeleteCost = () => {
    if (costToDelete) {
      deleteCostMutation.mutate({ id: costToDelete })
      setCostToDelete(null)
    }
  }

  // Bulk assign contact mutation
  const bulkAssignMutation = api.costs.bulkAssignContact.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} cost${data.count !== 1 ? "s" : ""} updated successfully`)
      setSelectedCostIds(new Set())
      setBulkAssignDialogOpen(false)
      setSelectedContactId(null)
      void utils.costs.list.invalidate(queryInput)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign contact")
    },
  })

  const handleBulkAssign = () => {
    if (selectedCostIds.size === 0) {
      toast.error("Please select at least one cost")
      return
    }
    bulkAssignMutation.mutate({
      costIds: Array.from(selectedCostIds),
      contactId: selectedContactId,
    })
  }

  const toggleCostSelection = (costId: string) => {
    setSelectedCostIds((prev) => {
      const next = new Set(prev)
      if (next.has(costId)) {
        next.delete(costId)
      } else {
        next.add(costId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!costsData) return
    if (selectedCostIds.size === costsData.length) {
      setSelectedCostIds(new Set())
    } else {
      setSelectedCostIds(new Set(costsData.map((c: any) => c.id)))
    }
  }

  if (costsLoading) {
    return <CostListSkeleton count={3} />
  }

  return (
    <>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {costsData && costsData.length > 0 && (
            <>
              <Checkbox
                id="select-all"
                checked={selectedCostIds.size === costsData.length && costsData.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all costs"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Select All
              </label>
              {selectedCostIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAssignDialogOpen(true)}
                  className="ml-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Contact ({selectedCostIds.size})
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CostImport
            projectId={projectId}
            onSuccess={() => {
              // Refresh the costs list after successful import
              void utils.costs.list.invalidate()
            }}
          />
          <Link href={`/projects/${projectId}/costs/new` as never}>
            <Button size="sm">Add Cost</Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {(!costsData || costsData.length === 0) && (
        <EmptyState
          title={
            searchText || Object.keys(filters).length > 0
              ? "No costs found"
              : "No costs recorded yet"
          }
          description={
            searchText || Object.keys(filters).length > 0
              ? "Try adjusting your search or filters"
              : 'Click "Add Cost" to get started'
          }
        />
      )}

      {/* Costs List */}
      {costsData && costsData.length > 0 && (
        <div className="space-y-3">
          {costsData.map((cost: any) => {
            const isHighlighted = highlightCostId === cost.id
            return (
              <CostItem
                key={cost.id}
                cost={cost}
                projectId={projectId}
                isHighlighted={isHighlighted}
                isSelected={selectedCostIds.has(cost.id)}
                onToggleSelection={() => toggleCostSelection(cost.id)}
                onDelete={() => setCostToDelete(cost.id)}
                highlightedCostRef={isHighlighted ? highlightedCostRef : null}
              />
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={costToDelete !== null}
        onOpenChange={(open) => !open && setCostToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cost</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cost? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Running Total */}
      {costsData && costsData.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total Costs</span>
            <span className="text-2xl font-bold">
              {new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
              }).format(totalCosts / 100)}
            </span>
          </div>
        </div>
      )}

      {/* Bulk Contact Assignment Dialog */}
      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Contact</DialogTitle>
            <DialogDescription>
              Assign a contact to {selectedCostIds.size} selected cost
              {selectedCostIds.size !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ContactSelector
              projectId={projectId}
              value={selectedContactId}
              onChange={setSelectedContactId}
              onCreateNew={() => {
                // Close bulk assign and let user create contact separately
                setBulkAssignDialogOpen(false)
                toast.info("Please create the contact first, then assign it to costs")
              }}
              allowUnassigned={true}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkAssignDialogOpen(false)
                setSelectedContactId(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={bulkAssignMutation.isPending}>
              {bulkAssignMutation.isPending ? "Assigning..." : "Assign Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
