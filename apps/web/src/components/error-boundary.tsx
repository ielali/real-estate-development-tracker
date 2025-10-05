"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  /**
   * Custom fallback component to render on error
   */
  fallback?: React.ComponentType<ErrorFallbackProps>
}

export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * DefaultErrorFallback - Default error UI displayed when ErrorBoundary catches an error
 *
 * Shows user-friendly error message with reset button
 * In development, shows error details for debugging
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === "development"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>

        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>

        {isDev && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Error details (development only)
            </summary>
            <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
              <div className="font-semibold mb-1">{error.name}</div>
              <div className="mb-2">{error.message}</div>
              {error.stack && <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>}
            </div>
          </details>
        )}

        <Button onClick={resetError} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  )
}

/**
 * ErrorBoundary - Global error boundary component
 *
 * Catches React component errors and displays a fallback UI
 * Prevents entire app from crashing due to component errors
 *
 * Features:
 * - User-friendly error display
 * - Reset functionality to recover from errors
 * - Error logging to console (Sentry integration ready)
 * - Development mode shows error details
 * - Production mode shows minimal user-facing message
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example Custom fallback
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    // TODO: Send error to Sentry or other error reporting service
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}
