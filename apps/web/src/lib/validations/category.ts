import { z } from "zod"

/**
 * ATO tax category enum for Australian tax compliance
 */
export const atoTaxCategorySchema = z.enum([
  "capital_works",
  "depreciation",
  "immediate_deduction",
  "financing_costs",
  "gst_input_credit",
  "land_acquisition",
  "professional_fees",
  "holding_costs",
  "not_applicable",
])

/**
 * Category type enum
 */
export const categoryTypeSchema = z.enum(["contact", "cost", "document", "event"])

/**
 * Zod schema for creating custom category
 */
export const createCategorySchema = z.object({
  type: categoryTypeSchema,
  displayName: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-/&()]+$/,
      "Only letters, numbers, spaces, hyphens, slashes, ampersands, and parentheses allowed"
    ),
  parentId: z.string().nullable(),
  taxDeductible: z.boolean().nullable().optional(),
  taxCategory: atoTaxCategorySchema.nullable().optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").nullable().optional(),
})

/**
 * Zod schema for archiving a category
 */
export const archiveCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
})

/**
 * Zod schema for listing categories
 */
export const listCategoriesSchema = z.object({
  type: categoryTypeSchema,
  includeArchived: z.boolean().optional().default(false),
})

/**
 * Zod schema for category spending breakdown query
 */
export const categorySpendingSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

/**
 * Type exports for use in components and routers
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type ArchiveCategoryInput = z.infer<typeof archiveCategorySchema>
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>
export type CategorySpendingInput = z.infer<typeof categorySpendingSchema>
export type ATOTaxCategory = z.infer<typeof atoTaxCategorySchema>
