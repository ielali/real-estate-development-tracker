import React from "react"
import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  /**
   * Error title - typically "Failed to load..." or "Error"
   */
  title?: string
  /**
   * Error message or description
   */
  message: string
  /**
   * Optional action button (typically a retry button)
   */
  action?: React.ReactNode
  /**
   * Whether to show the error icon
   * @default true
   */
  showIcon?: boolean
}

/**
 * ErrorState - Reusable component for displaying error states
 *
 * Provides consistent error UI across the application with:
 * - Error icon (AlertCircle)
 * - Title and message
 * - Optional retry/action button
 * - Accessible markup with proper ARIA labels
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load projects"
 *   message="Unable to fetch project data. Please try again."
 *   action={<Button onClick={refetch}>Try Again</Button>}
 * />
 * ```
 */
export function ErrorState({ title, message, action, showIcon = true }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <div className="mb-4">
          <AlertCircle className="w-16 h-16 text-red-500" aria-hidden="true" />
        </div>
      )}
      {title && <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>}
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {action}
    </div>
  )
}
