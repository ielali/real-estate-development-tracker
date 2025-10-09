"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/trpc/client"
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations/category"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { Category, CategoryType, ATOTaxCategory } from "@/server/db/types"

interface CategoryFormProps {
  type: CategoryType
  onSuccess?: (category: Category) => void
  onCancel?: () => void
}

const ATO_TAX_CATEGORIES: Array<{ value: ATOTaxCategory; label: string; description: string }> = [
  {
    value: "capital_works",
    label: "Capital Works",
    description: "Division 43 deductions - depreciate over time",
  },
  {
    value: "depreciation",
    label: "Depreciation",
    description: "Division 40 deductions",
  },
  {
    value: "immediate_deduction",
    label: "Immediate Deduction",
    description: "Section 8-1 immediate expense",
  },
  {
    value: "financing_costs",
    label: "Financing Costs",
    description: "Section 25-25 borrowing expenses",
  },
  {
    value: "gst_input_credit",
    label: "GST Input Credit",
    description: "GST credits (not expense deduction)",
  },
  {
    value: "land_acquisition",
    label: "Land Acquisition",
    description: "Non-deductible capital cost",
  },
  {
    value: "professional_fees",
    label: "Professional Fees",
    description: "Section 40-880 blackhole expenditure",
  },
  {
    value: "holding_costs",
    label: "Holding Costs",
    description: "Deductible holding costs",
  },
  {
    value: "not_applicable",
    label: "Not Applicable",
    description: "Not tax-related",
  },
]

/**
 * CategoryForm - Form component for creating custom categories
 *
 * Features:
 * - Parent category selection for hierarchical relationships
 * - Tax deductibility toggle (cost categories only)
 * - ATO tax category dropdown (cost categories only)
 * - Notes textarea for accountant context
 * - Input validation with regex patterns
 */
export function CategoryForm({ type, onSuccess, onCancel }: CategoryFormProps) {
  const { toast } = useToast()
  const utils = api.useUtils()

  // Get parent categories for the type
  const { data: categories = [], isLoading: loadingCategories } = api.category.list.useQuery({
    type,
    includeArchived: false,
  })

  // Filter to only parent categories (those without parentId)
  const parentCategories = categories.filter((cat) => !cat.parentId)

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      type,
      displayName: "",
      parentId: null,
      taxDeductible: null,
      taxCategory: null,
      notes: "",
    },
  })

  const createCategoryMutation = api.category.create.useMutation({
    onSuccess: (newCategory) => {
      toast({
        title: "Success",
        description: `Category "${newCategory.displayName}" created successfully`,
      })
      // Invalidate category list
      void utils.category.list.invalidate({ type })
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newCategory)
      }
      // Reset form
      form.reset()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (data: CreateCategoryInput) => {
    createCategoryMutation.mutate(data)
  }

  const isCostCategory = type === "cost"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Display Name */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Custom Consulting Fee"
                  disabled={createCategoryMutation.isPending}
                />
              </FormControl>
              <FormDescription>
                Use letters, numbers, spaces, hyphens, slashes, ampersands, and parentheses only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Category */}
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined}
                disabled={createCategoryMutation.isPending || loadingCategories}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Group this category under a parent for better organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tax Deductible (Cost categories only) */}
        {isCostCategory && (
          <FormField
            control={form.control}
            name="taxDeductible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Tax Deductible</FormLabel>
                  <FormDescription>
                    Mark if this cost category is tax deductible (consult your accountant)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={(checked: boolean) => field.onChange(checked ? true : null)}
                    disabled={createCategoryMutation.isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* ATO Tax Category (Cost categories only) */}
        {isCostCategory && (
          <FormField
            control={form.control}
            name="taxCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ATO Tax Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                  disabled={createCategoryMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax category (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not Specified</SelectItem>
                    {ATO_TAX_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-gray-500">{cat.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Australian Taxation Office category for reporting purposes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Add notes for your accountant or additional context..."
                  rows={3}
                  disabled={createCategoryMutation.isPending}
                />
              </FormControl>
              <FormDescription>
                Maximum 500 characters. Provide context for accounting purposes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={createCategoryMutation.isPending}>
            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createCategoryMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
