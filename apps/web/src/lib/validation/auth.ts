import { z } from "zod"

/**
 * Shared password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Allows all special characters and Unicode characters
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]*$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number. All special characters, symbols, and Unicode characters are allowed."
  )

/**
 * Password validation with confirmation
 */
export const passwordWithConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
