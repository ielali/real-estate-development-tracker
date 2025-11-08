# Error Handling Strategy

## Unified Error Handling

**Error Response Format:**

```typescript
interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    requestId: string
  }
}
```

**Frontend Error Handling:**

```typescript
// Global error boundary for component errors
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>{error.message}</details>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('Component error:', error, errorInfo);
        // Send to Sentry
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// tRPC error handling
const utils = api.useContext();
const { mutate: addCost } = api.costs.quickAdd.useMutation({
  onError: (error) => {
    toast.error(error.message);
  },
  onSuccess: () => {
    utils.costs.invalidate();
    toast.success('Cost added successfully');
  },
});
```

**Backend Error Handling:**

```typescript
// tRPC error handler
export const errorHandler = (error: any, req: any) => {
  console.error("tRPC Error:", error)

  if (error.code === "UNAUTHORIZED") {
    return { code: "UNAUTHORIZED", message: "Please log in to continue" }
  }

  if (error.code === "FORBIDDEN") {
    return { code: "FORBIDDEN", message: "You do not have permission for this action" }
  }

  // Log to Sentry
  return { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" }
}
```
