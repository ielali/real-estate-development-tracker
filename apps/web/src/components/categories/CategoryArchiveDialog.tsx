"use client"

import { api } from "@/lib/trpc/client"
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
import { useToast } from "@/hooks/use-toast"
import type { Category } from "@/server/db/types"

interface CategoryArchiveDialogProps {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * CategoryArchiveDialog - Confirmation dialog for archiving categories
 *
 * Features:
 * - Shows warning if category has linked costs
 * - Prevents deletion with clear messaging
 * - Explains that archiving preserves historical data
 */
export function CategoryArchiveDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryArchiveDialogProps) {
  const { toast } = useToast()
  const utils = api.useUtils()

  const archiveMutation = api.category.archive.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Category "${category.displayName}" has been archived`,
      })
      // Invalidate category lists
      void utils.category.list.invalidate({ type: category.type })
      // Call success callback
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive category",
        variant: "destructive",
      })
    },
  })

  const handleArchive = () => {
    archiveMutation.mutate({ id: category.id })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Category?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive "{category.displayName}"?
            <br />
            <br />
            Archiving will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Hide this category from selection lists</li>
              <li>Preserve all historical cost data</li>
              <li>Keep the category visible in existing records</li>
            </ul>
            <br />
            <strong>Note:</strong> If this category has linked costs, it cannot be permanently
            deleted. Archiving is the recommended way to remove unused categories while maintaining
            data integrity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {archiveMutation.isPending ? "Archiving..." : "Archive Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
