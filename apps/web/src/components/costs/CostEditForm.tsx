"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { api } from "@/lib/trpc/client"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { getCategoriesByType, getCategoryById } from "@/server/db/types"
import { formatCurrencyInput, dollarsToCents, centsToDollars } from "@/lib/utils/currency"
import { RelatedDocuments } from "@/components/documents/RelatedDocuments"
import { DocumentLinkSelector } from "@/components/documents/DocumentLinkSelector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link as LinkIcon } from "lucide-react"
import { ContactSelector } from "./ContactSelector"
import { QuickContactCreate } from "./QuickContactCreate"

/**
 * Client-side form schema for cost editing
 */
const costEditFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  contactId: z.string().uuid().nullable().optional(),
})

type FormValues = z.infer<typeof costEditFormSchema>

export interface CostEditFormProps {
  projectId: string
  costId: string
}

/**
 * CostEditForm - Form component for editing existing cost entries
 *
 * Loads existing cost data and allows updating all fields.
 * Includes delete functionality with confirmation dialog.
 */
export function CostEditForm({ projectId, costId }: CostEditFormProps) {
  const router = useRouter()
  const utils = api.useUtils()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isQuickContactOpen, setIsQuickContactOpen] = React.useState(false)

  // Fetch existing cost data
  const { data: costData, isLoading } = api.costs.getById.useQuery({ id: costId })

  // Get cost categories for the dropdown - only children with parents
  const allCostCategories = getCategoriesByType("cost")
  const costCategories = allCostCategories.filter((cat) => cat.parentId !== null)

  // Group categories by parent
  const categoryGroups = costCategories.reduce(
    (acc, category) => {
      if (category.parentId) {
        if (!acc[category.parentId]) {
          acc[category.parentId] = []
        }
        acc[category.parentId].push(category)
      }
      return acc
    },
    {} as Record<string, typeof costCategories>
  )

  // Get today's date in YYYY-MM-DD format for validation
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(costEditFormSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: "",
      date: today,
      contactId: null,
    },
  })

  // Update form when data loads
  React.useEffect(() => {
    if (costData) {
      const formValues = {
        amount: formatCurrencyInput(centsToDollars(costData.amount)),
        description: costData.description,
        categoryId: costData.categoryId,
        date: new Date(costData.date).toISOString().split("T")[0],
        contactId: costData.contactId || null,
      }

      form.reset(formValues)

      // Force set the categoryId separately to ensure it's set
      // This is needed because the Select component doesn't always update properly on reset
      setTimeout(() => {
        form.setValue("categoryId", costData.categoryId)
        if (costData.contactId) {
          form.setValue("contactId", costData.contactId)
        }
      }, 0)
    }
  }, [costData])

  const updateCost = api.costs.update.useMutation({
    // Optimistic update: Update cost in UI immediately
    onMutate: async (updatedCost) => {
      // Cancel outgoing refetches
      await utils.costs.list.cancel({ projectId })

      // Snapshot the previous value
      const previousCosts = utils.costs.list.getData({ projectId })

      // Optimistically update the cost
      if (previousCosts) {
        utils.costs.list.setData(
          { projectId },
          previousCosts.map(
            (
              cost: any // eslint-disable-line @typescript-eslint/no-explicit-any
            ) =>
              cost.id === updatedCost.id ? { ...cost, ...updatedCost, updatedAt: new Date() } : cost
          )
        )
      }

      return { previousCosts }
    },
    onSuccess: () => {
      toast.success("Cost updated successfully")
      void utils.costs.list.invalidate({ projectId })
      router.push(`/projects/${projectId}?tab=costs` as never)
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousCosts) {
        utils.costs.list.setData({ projectId }, context.previousCosts)
      }
      toast.error(error.message || "Failed to update cost")
    },
  })

  const deleteCost = api.costs.softDelete.useMutation({
    onSuccess: () => {
      toast.success("Cost deleted successfully")
      void utils.costs.list.invalidate()
      router.push(`/projects/${projectId}?tab=costs` as never)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete cost")
    },
  })

  const onSubmit = (data: FormValues) => {
    // Convert amount from dollars to cents
    const amountInCents = dollarsToCents(data.amount)

    // Convert date string to Date object
    const dateObj = new Date(data.date)

    // Validate date is not in future
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    if (dateObj > now) {
      toast.error("Date cannot be in the future")
      return
    }

    updateCost.mutate({
      id: costId,
      amount: amountInCents,
      description: data.description,
      categoryId: data.categoryId,
      date: dateObj,
      contactId: data.contactId || null,
    })
  }

  const handleDelete = () => {
    deleteCost.mutate({ id: costId })
    setDeleteDialogOpen(false)
  }

  const isSubmitting = updateCost.isPending || deleteCost.isPending

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading...</div>
  }

  if (!costData) {
    return <div className="text-red-600">Cost not found</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Amount field */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (AUD)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...field}
                    disabled={isSubmitting}
                    className="min-h-[44px]"
                    onChange={(e) => {
                      field.onChange(formatCurrencyInput(e.target.value))
                    }}
                  />
                </FormControl>
                <FormDescription>Enter the cost amount in Australian dollars</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category field */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search categories..."
                        className="mb-2"
                        onChange={(e) => {
                          const search = e.target.value.toLowerCase()
                          const groups = document.querySelectorAll("[data-category-group]")

                          groups.forEach((group) => {
                            const htmlGroup = group as HTMLElement
                            const items = htmlGroup.querySelectorAll('[role="option"]')
                            let hasVisibleItems = false

                            items.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || ""
                              const htmlItem = item as HTMLElement
                              const matches = text.includes(search)
                              htmlItem.style.display = matches ? "" : "none"
                              if (matches) hasVisibleItems = true
                            })

                            htmlGroup.style.display = hasVisibleItems ? "" : "none"
                          })
                        }}
                      />
                    </div>
                    {Object.entries(categoryGroups).map(([parentId, categories]) => {
                      const parent = getCategoryById(parentId)
                      return (
                        <SelectGroup key={parentId} data-category-group>
                          <SelectLabel>{parent?.displayName}</SelectLabel>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.displayName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )
                    })}
                  </SelectContent>
                </Select>
                <FormDescription>Select the cost category</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={isSubmitting}
                    max={today}
                    className="min-h-[44px]"
                  />
                </FormControl>
                <FormDescription>When was this cost incurred?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter cost description"
                  {...field}
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                />
              </FormControl>
              <FormDescription>Brief description of this cost</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact field */}
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact (Optional)</FormLabel>
              <FormControl>
                <ContactSelector
                  projectId={projectId}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  onCreateNew={() => setIsQuickContactOpen(true)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Associate this cost with a contact (contractor, vendor, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Related Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Related Documents</CardTitle>
                <CardDescription>Documents linked to this cost</CardDescription>
              </div>
              <DocumentLinkSelector entityType="cost" entityId={costId} projectId={projectId}>
                <Button type="button" variant="outline" size="sm">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link Documents
                </Button>
              </DocumentLinkSelector>
            </div>
          </CardHeader>
          <CardContent>
            <RelatedDocuments entityType="cost" entityId={costId} />
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-between">
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isSubmitting}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Delete
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
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      <QuickContactCreate
        projectId={projectId}
        isOpen={isQuickContactOpen}
        onClose={() => setIsQuickContactOpen(false)}
        onSuccess={(contact) => {
          form.setValue("contactId", contact.id)
          setIsQuickContactOpen(false)
        }}
      />
    </Form>
  )
}
