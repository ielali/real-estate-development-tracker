import { toast, toastPatterns } from "./toast"

/**
 * Error handling utilities with retry mechanisms
 * Provides consistent error handling patterns across the application
 */

export type RetryOptions = {
  maxAttempts?: number
  delayMs?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        onRetry?.(attempt, lastError)

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

/**
 * Error response types for better error categorization
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

export class AppError extends Error {
  type: ErrorType
  statusCode?: number
  details?: unknown

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    details?: unknown
  ) {
    super(message)
    this.name = "AppError"
    this.type = type
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * Parse API errors into structured AppError instances
 */
export function parseApiError(error: unknown): AppError {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new AppError("Network error. Please check your connection.", ErrorType.NETWORK)
  }

  // tRPC errors (common in this app)
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message: string; data?: { code?: string; httpStatus?: number } }

    if (err.data?.code === "UNAUTHORIZED") {
      return new AppError(err.message, ErrorType.UNAUTHORIZED, err.data.httpStatus)
    }

    if (err.data?.code === "NOT_FOUND") {
      return new AppError(err.message, ErrorType.NOT_FOUND, err.data.httpStatus)
    }

    if (err.data?.code === "BAD_REQUEST") {
      return new AppError(err.message, ErrorType.VALIDATION, err.data.httpStatus)
    }

    if (err.data?.httpStatus && err.data.httpStatus >= 500) {
      return new AppError(err.message, ErrorType.SERVER, err.data.httpStatus)
    }

    return new AppError(err.message, ErrorType.UNKNOWN, err.data?.httpStatus)
  }

  // Generic errors
  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.UNKNOWN)
  }

  return new AppError("An unknown error occurred", ErrorType.UNKNOWN)
}

/**
 * Handle errors with appropriate user feedback
 * Automatically shows toast notifications based on error type
 */
export function handleError(error: unknown, context?: string): AppError {
  const appError = parseApiError(error)

  // Log for debugging
  console.error(`[${context || "Error"}]:`, appError)

  // Show appropriate toast
  switch (appError.type) {
    case ErrorType.NETWORK:
      toastPatterns.networkError()
      break

    case ErrorType.UNAUTHORIZED:
      toastPatterns.unauthorized()
      break

    case ErrorType.VALIDATION:
      toast.error("Validation error", appError.message)
      break

    case ErrorType.NOT_FOUND:
      toast.error("Not found", appError.message)
      break

    case ErrorType.SERVER:
      toast.error("Server error", "Something went wrong on our end. Please try again later.")
      break

    default:
      toast.error("Error", appError.message || "An unexpected error occurred")
  }

  return appError
}

/**
 * Wrap async function with error handling and retry
 * Automatically shows loading toast and handles errors
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string | ((data: T) => string)
    errorMessage?: string
    retry?: RetryOptions
    context?: string
  } = {}
): Promise<T | null> {
  const { loadingMessage, successMessage, errorMessage, retry, context } = options

  try {
    // Show loading toast if message provided
    const toastId = loadingMessage ? toast.loading(loadingMessage) : undefined

    // Execute with retry if configured
    const result = retry ? await retryWithBackoff(fn, retry) : await fn()

    // Dismiss loading toast
    if (toastId) toast.dismiss(toastId)

    // Show success toast if message provided
    if (successMessage) {
      const message = typeof successMessage === "function" ? successMessage(result) : successMessage
      toast.success(message)
    }

    return result
  } catch (error) {
    // handleError logs and shows appropriate toast
    handleError(error, context)

    // Override with custom error message if provided
    if (errorMessage) {
      toast.error(errorMessage)
    }

    // Return null to allow graceful degradation
    return null
  }
}

/**
 * Safe async function wrapper that catches and logs errors
 * Returns a default value on error instead of throwing
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[${context || "tryCatch"}]:`, error)
    return defaultValue
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.NETWORK
  }
  if (error instanceof TypeError) {
    return error.message.includes("fetch") || error.message.includes("network")
  }
  return false
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const appError = parseApiError(error)

  // Retry network errors and server errors, but not client errors
  return (
    appError.type === ErrorType.NETWORK ||
    appError.type === ErrorType.SERVER ||
    (appError.statusCode !== undefined && appError.statusCode >= 500)
  )
}

/**
 * Create a retry-enabled fetch wrapper
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new AppError(
          `HTTP error ${response.status}`,
          response.status >= 500 ? ErrorType.SERVER : ErrorType.UNKNOWN,
          response.status
        )
      }

      return response
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoff: true,
      ...retryOptions,
    }
  )
}
