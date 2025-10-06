import { z } from "zod"

/**
 * Contact form validation schema
 * Defines validation rules for creating and updating contacts
 */
export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().max(100, "Last name is too long").nullable().optional(),
  company: z.string().max(200, "Company name is too long").nullable().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email is too long")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50, "Phone number is too long").nullable().optional(),
  mobile: z.string().max(50, "Mobile number is too long").nullable().optional(),
  website: z
    .string()
    .url("Invalid website URL")
    .max(255, "Website URL is too long")
    .nullable()
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  addressId: z.string().uuid("Invalid address ID").nullable().optional(),
  notes: z.string().max(2000, "Notes are too long").nullable().optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

/**
 * Contact update validation schema
 * All fields are optional for partial updates
 */
export const contactUpdateSchema = z.object({
  id: z.string().uuid("Invalid contact ID"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long")
    .optional(),
  lastName: z.string().max(100, "Last name is too long").nullable().optional(),
  company: z.string().max(200, "Company name is too long").nullable().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email is too long")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50, "Phone number is too long").nullable().optional(),
  mobile: z.string().max(50, "Mobile number is too long").nullable().optional(),
  website: z
    .string()
    .url("Invalid website URL")
    .max(255, "Website URL is too long")
    .nullable()
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, "Category is required").optional(),
  addressId: z.string().uuid("Invalid address ID").nullable().optional(),
  notes: z.string().max(2000, "Notes are too long").nullable().optional(),
})

export type ContactUpdateData = z.infer<typeof contactUpdateSchema>

/**
 * Contact filter validation schema
 * Used for list queries with search and filtering
 */
export const contactFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  parentCategoryId: z.string().optional(),
})

export type ContactFilterData = z.infer<typeof contactFilterSchema>

/**
 * Project-Contact association validation schema
 */
export const projectContactSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  contactId: z.string().uuid("Invalid contact ID"),
})

export type ProjectContactData = z.infer<typeof projectContactSchema>
