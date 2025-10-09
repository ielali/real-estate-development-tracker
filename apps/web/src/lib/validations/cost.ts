import { z } from "zod"

/**
 * Zod schema for creating a cost entry
 *
 * Validates cost data with the following requirements:
 * - Amount must be positive integer (stored in cents)
 * - Description is required
 * - Category must be a valid cost category ID
 * - Date cannot be in the future
 * - Optional contactId for linking to contractors/vendors
 */
export const createCostSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  amount: z.number().int().positive("Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.date().max(new Date(), "Date cannot be in the future"),
  contactId: z.string().uuid().nullable().optional(),
})

/**
 * Zod schema for updating a cost entry
 */
export const updateCostSchema = z.object({
  id: z.string().uuid("Invalid cost ID"),
  amount: z.number().int().positive("Amount must be a positive number").optional(),
  description: z.string().min(1, "Description is required").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  date: z.date().max(new Date(), "Date cannot be in the future").optional(),
  contactId: z.string().uuid().nullable().optional(),
})

/**
 * Zod schema for cost query filters
 *
 * Extended with search, filtering, and sorting capabilities for Story 2.4
 */
export const listCostsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  // Search and filter fields
  searchText: z.string().max(200).optional(),
  minAmount: z.number().int().nonnegative().optional(),
  maxAmount: z.number().int().nonnegative().optional(),
  contactId: z.string().uuid().optional(),
  contactNameSearch: z.string().max(100).optional(),
  // Sort fields
  sortBy: z.enum(["date", "amount", "contact", "category"]).default("date"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
})

/**
 * Zod schema for getting a single cost by ID
 */
export const getCostByIdSchema = z.object({
  id: z.string().uuid("Invalid cost ID"),
})

/**
 * Zod schema for soft deleting a cost
 */
export const deleteCostSchema = z.object({
  id: z.string().uuid("Invalid cost ID"),
})

/**
 * Type exports for use in components
 */
export type CreateCostInput = z.infer<typeof createCostSchema>
export type UpdateCostInput = z.infer<typeof updateCostSchema>
export type ListCostsInput = z.infer<typeof listCostsSchema>
export type GetCostByIdInput = z.infer<typeof getCostByIdSchema>
export type DeleteCostInput = z.infer<typeof deleteCostSchema>
