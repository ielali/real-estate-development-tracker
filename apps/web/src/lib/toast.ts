import { toast as sonnerToast } from "sonner"

/**
 * Toast utilities for common notification patterns
 * Uses Sonner for a better UX with smooth animations and positioning
 */

export const toast = {
  /**
   * Success toast - use for successful operations
   */
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Error toast - use for errors and failures
   */
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 6000, // Errors stay longer
    })
  },

  /**
   * Info toast - use for informational messages
   */
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },

  /**
   * Warning toast - use for warnings
   */
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 5000,
    })
  },

  /**
   * Loading toast - use for ongoing operations
   * Returns a function to dismiss the toast
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },

  /**
   * Promise toast - automatically handles loading/success/error states
   * Use for async operations to reduce boilerplate
   */
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },

  /**
   * Custom toast with action button
   */
  action: (message: string, actionLabel: string, onAction: () => void, description?: string) => {
    return sonnerToast(message, {
      description,
      action: {
        label: actionLabel,
        onClick: onAction,
      },
      duration: 6000,
    })
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    sonnerToast.dismiss()
  },
}

/**
 * Common toast patterns for CRUD operations
 */
export const toastPatterns = {
  /**
   * Use for successful create operations
   */
  created: (entity: string) => {
    toast.success(`${entity} created`, `The ${entity.toLowerCase()} has been created successfully.`)
  },

  /**
   * Use for successful update operations
   */
  updated: (entity: string) => {
    toast.success(`${entity} updated`, `The ${entity.toLowerCase()} has been updated successfully.`)
  },

  /**
   * Use for successful delete operations
   */
  deleted: (entity: string) => {
    toast.success(`${entity} deleted`, `The ${entity.toLowerCase()} has been deleted successfully.`)
  },

  /**
   * Use for operation failures
   */
  operationFailed: (operation: string, entity: string) => {
    toast.error(
      `Failed to ${operation.toLowerCase()} ${entity.toLowerCase()}`,
      "Please try again or contact support if the problem persists."
    )
  },

  /**
   * Use for validation errors
   */
  validationError: (message?: string) => {
    toast.error("Validation error", message || "Please check the form fields and try again.")
  },

  /**
   * Use for network/API errors
   */
  networkError: () => {
    toast.error("Network error", "Please check your internet connection and try again.")
  },

  /**
   * Use for unauthorized access
   */
  unauthorized: () => {
    toast.error("Unauthorized", "You don't have permission to perform this action.")
  },

  /**
   * Use for successful save with draft option
   */
  saved: (entity: string) => {
    toast.success(`${entity} saved`, "Your changes have been saved.")
  },

  /**
   * Use when copying to clipboard
   */
  copied: (content: string = "Content") => {
    toast.success(`${content} copied`, "Copied to clipboard")
  },

  /**
   * Use for file upload success
   */
  uploaded: (fileName: string) => {
    toast.success("Upload complete", `${fileName} has been uploaded successfully.`)
  },

  /**
   * Use for file upload failure
   */
  uploadFailed: (fileName: string, reason?: string) => {
    toast.error("Upload failed", reason || `Failed to upload ${fileName}. Please try again.`)
  },
}
