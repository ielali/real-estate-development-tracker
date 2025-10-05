"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2 } from "lucide-react"

interface CostsListProps {
  projectId: string
}

/**
 * CostsList - Lazy-loaded component for displaying project costs
 *
 * Shows list of all costs with edit/delete actions and running total
 * Loads data independently from parent component
 */
export function CostsList({ projectId }: CostsListProps) {
  const { toast } = useToast()
  const [costToDelete, setCostToDelete] = useState<string | null>(null)
  const utils = api.useUtils()

  // Fetch costs for this project
  const { data: costsData, isLoading: costsLoading } = api.costs.list.useQuery({ projectId })

  // Calculate total costs
  const totalCosts = costsData?.reduce((sum, cost) => sum + cost.amount, 0) ?? 0

  const deleteCostMutation = api.costs.softDelete.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cost deleted successfully",
      })
      void utils.costs.list.invalidate()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cost",
        variant: "destructive",
      })
    },
  })

  const handleDeleteCost = () => {
    if (costToDelete) {
      deleteCostMutation.mutate({ id: costToDelete })
      setCostToDelete(null)
    }
  }

  if (costsLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <>
      {/* Add Cost Button - Always visible */}
      <div className="flex justify-end mb-4">
        <Link href={`/projects/${projectId}/costs/new` as never}>
          <Button size="sm">Add Cost</Button>
        </Link>
      </div>

      {/* Empty State */}
      {(!costsData || costsData.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No costs recorded yet</p>
          <p className="text-sm text-gray-500">Click "Add Cost" to get started</p>
        </div>
      )}

      {/* Costs List */}
      {costsData && costsData.length > 0 && (
        <div className="space-y-3">
          {costsData.map((cost) => (
            <div
              key={cost.id}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{cost.description}</span>
                  {cost.category && (
                    <Badge variant="outline" className="text-xs">
                      {cost.category.displayName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{new Date(cost.date).toLocaleDateString()}</p>
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
                  <AlertDialog
                    open={costToDelete === cost.id}
                    onOpenChange={(open) => !open && setCostToDelete(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setCostToDelete(cost.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </>
  )
}
