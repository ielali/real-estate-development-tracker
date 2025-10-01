"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { api } from "@/lib/trpc/client"
import { useToast } from "@/hooks/use-toast"
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
import { getCategoriesByType, getCategoryById } from "@/server/db/types"
import { formatCurrencyInput, dollarsToCents } from "@/lib/utils/currency"

/**
 * Client-side form schema for cost entry
 * Validates form input and converts to API format
 */
const costEntryFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
})

type FormValues = z.infer<typeof costEntryFormSchema>

export interface CostEntryFormProps {
  /**
   * Project ID for the cost entry
   */
  projectId: string
  /**
   * Callback fired after successful cost creation
   */
  onSuccess?: (costId: string) => void
  /**
   * Optional initial form values
   */
  defaultValues?: Partial<FormValues>
}

/**
 * CostEntryForm - Form component for creating new cost entries
 *
 * Handles cost creation with amount, description, category, and date.
 * Amount is converted to cents before submission to prevent
 * floating-point precision errors.
 *
 * Mobile-optimized with:
 * - Minimum 44x44px touch targets
 * - Vertical stacking on mobile devices
 * - Native date picker for mobile support
 * - Large, easy-to-tap form fields
 *
 * @param projectId - Project ID for the cost entry
 * @param onSuccess - Callback fired after successful cost creation
 * @param defaultValues - Optional initial form values
 */
export function CostEntryForm({ projectId, onSuccess, defaultValues }: CostEntryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const utils = api.useUtils()

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

  // Get today's date in YYYY-MM-DD format for default value
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(costEntryFormSchema),
    defaultValues: {
      amount: defaultValues?.amount ?? "",
      description: defaultValues?.description ?? "",
      categoryId: defaultValues?.categoryId ?? undefined,
      date: defaultValues?.date ?? today,
    },
  })

  const createCost = api.costs.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Cost added successfully",
      })
      // Invalidate costs list to refetch
      void utils.costs.list.invalidate()
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push(`/projects/${projectId}?tab=costs` as never)
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add cost",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    // Convert amount from dollars to cents
    const amountInCents = dollarsToCents(data.amount)

    // Convert date string to Date object
    const dateObj = new Date(data.date)

    // Validate date is not in future
    const now = new Date()
    now.setHours(23, 59, 59, 999) // Set to end of today
    if (dateObj > now) {
      toast({
        title: "Error",
        description: "Date cannot be in the future",
        variant: "destructive",
      })
      return
    }

    createCost.mutate({
      projectId,
      amount: amountInCents,
      description: data.description,
      categoryId: data.categoryId,
      date: dateObj,
    })
  }

  const isSubmitting = createCost.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Mobile-first: Stack all fields vertically */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Amount field - Full width on mobile, half on tablet+ */}
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
                  defaultValue={field.value}
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

                            // Hide the entire group if no items match
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

        {/* Description field - Full width */}
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

        {/* Submit button - Full width on mobile */}
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
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
            {isSubmitting ? "Adding..." : "Add Cost"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
