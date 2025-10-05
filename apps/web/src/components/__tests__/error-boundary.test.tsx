import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { ErrorBoundary, type ErrorFallbackProps } from "../error-boundary"

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message")
  }
  return <div>Normal content</div>
}

// Custom fallback for testing
function CustomFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div>
      <h1>Custom Error</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Reset</button>
    </div>
  )
}

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

  beforeEach(() => {
    consoleErrorSpy.mockClear()
  })

  describe("Error catching", () => {
    it("renders children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText("Normal content")).toBeInTheDocument()
    })

    it("renders default fallback UI when child component throws error", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
    })

    it("displays error in fallback UI", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error boundary renders fallback with error message
      expect(within(container).getByText("Something went wrong")).toBeInTheDocument()
    })
  })

  describe("Error logging", () => {
    it("calls console.error when error is caught", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find((call) =>
        call[0]?.includes?.("ErrorBoundary caught an error")
      )
      expect(errorCall).toBeDefined()
    })
  })

  describe("Reset functionality", () => {
    it("resets error state when Try again button is clicked", async () => {
      const user = userEvent.setup()

      // Component that can toggle between error and normal state
      function ToggleError({ throwError }: { throwError: boolean }) {
        if (throwError) {
          throw new Error("Test error")
        }
        return <div>Normal content</div>
      }

      // Use a state wrapper to control the error
      function Wrapper() {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <ErrorBoundary
            fallback={({ resetError }) => (
              <div>
                <p>Error occurred</p>
                <button
                  onClick={() => {
                    setShouldThrow(false)
                    resetError()
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          >
            <ToggleError throwError={shouldThrow} />
          </ErrorBoundary>
        )
      }

      const { container } = render(<Wrapper />)

      // Verify error state
      expect(within(container).getByText("Error occurred")).toBeInTheDocument()

      // Click reset button
      const resetButton = within(container).getByRole("button", { name: /try again/i })
      await user.click(resetButton)

      // After reset, normal content should appear
      await waitFor(() => {
        expect(within(container).getByText("Normal content")).toBeInTheDocument()
      })
    })
  })

  describe("Custom fallback", () => {
    it("renders custom fallback component when provided", () => {
      const { container } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(within(container).getByText("Custom Error")).toBeInTheDocument()
      expect(within(container).getByText("Test error message")).toBeInTheDocument()
    })

    it("passes error and resetError props to custom fallback", async () => {
      const user = userEvent.setup()

      function ToggleError({ throwError }: { throwError: boolean }) {
        if (throwError) {
          throw new Error("Test error message")
        }
        return <div>Normal content</div>
      }

      function Wrapper() {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <ErrorBoundary
            fallback={({ error, resetError }) => (
              <div>
                <h1>Custom Error</h1>
                <p>{error.message}</p>
                <button
                  onClick={() => {
                    setShouldThrow(false)
                    resetError()
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          >
            <ToggleError throwError={shouldThrow} />
          </ErrorBoundary>
        )
      }

      const { container } = render(<Wrapper />)

      // Verify custom fallback receives error
      expect(within(container).getByText("Test error message")).toBeInTheDocument()

      // Verify resetError function works
      const resetButton = within(container).getByRole("button", { name: /reset/i })
      await user.click(resetButton)

      await waitFor(() => {
        expect(within(container).getByText("Normal content")).toBeInTheDocument()
      })
    })
  })

  describe("Development mode", () => {
    it("renders error boundary with fallback UI", () => {
      // Error boundary renders with fallback when error occurs
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error fallback should be visible
      expect(within(container).getByText("Something went wrong")).toBeInTheDocument()
      expect(within(container).getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("has accessible error message", () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Check heading exists
      expect(
        within(container).getByRole("heading", { name: /something went wrong/i })
      ).toBeInTheDocument()

      // Check button is accessible
      expect(within(container).getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })

    it("error icon has aria-hidden attribute", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const icon = document.querySelector('svg[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})
