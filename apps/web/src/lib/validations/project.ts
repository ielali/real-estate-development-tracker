import { z } from "zod"

/**
 * Shared Zod schemas and constants for project-related validations
 * This eliminates duplication between ProjectCreateForm and ProjectEditForm
 */

/**
 * Project types available in the system
 */
export const PROJECT_TYPES = [
  { value: "renovation", label: "Renovation" },
  { value: "new_build", label: "New Build" },
  { value: "development", label: "Development" },
  { value: "maintenance", label: "Maintenance" },
] as const

/**
 * Project statuses
 */
export const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const

/**
 * Australian states enum
 */
export const AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const

/**
 * Shared address validation schema
 */
export const addressSchema = z.object({
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetType: z.string().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  state: z.enum(AUSTRALIAN_STATES, {
    errorMap: () => ({ message: "Please select a state" }),
  }),
  postcode: z
    .string()
    .regex(/^\d{4}$/, "Postcode must be 4 digits")
    .min(1, "Postcode is required"),
})

/**
 * Project type enum schema
 */
export const projectTypeSchema = z.enum(["renovation", "new_build", "development", "maintenance"], {
  errorMap: () => ({ message: "Please select a project type" }),
})

/**
 * Project status enum schema
 */
export const projectStatusSchema = z.enum(
  ["planning", "active", "on_hold", "completed", "archived"],
  {
    errorMap: () => ({ message: "Please select a status" }),
  }
)

/**
 * Base project fields shared between create and edit forms
 */
export const baseProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  projectType: projectTypeSchema,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  totalBudget: z.string().optional(),
})

/**
 * Schema for project creation form (includes address fields)
 */
export const projectCreateFormSchema = baseProjectSchema.extend({
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetType: z.string().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  state: z.enum(AUSTRALIAN_STATES, {
    errorMap: () => ({ message: "Please select a state" }),
  }),
  postcode: z
    .string()
    .regex(/^\d{4}$/, "Postcode must be 4 digits")
    .min(1, "Postcode is required"),
})

/**
 * Schema for project edit form (includes status and address fields)
 */
export const projectEditFormSchema = baseProjectSchema.extend({
  status: projectStatusSchema,
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetType: z.string().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  state: z.enum(AUSTRALIAN_STATES, {
    errorMap: () => ({ message: "Please select a state" }),
  }),
  postcode: z
    .string()
    .regex(/^\d{4}$/, "Postcode must be 4 digits")
    .min(1, "Postcode is required"),
})

export type ProjectCreateFormValues = z.infer<typeof projectCreateFormSchema>
export type ProjectEditFormValues = z.infer<typeof projectEditFormSchema>
