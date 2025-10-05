import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  /**
   * Size of the spinner
   * @default "default"
   */
  size?: "sm" | "default" | "lg"
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * ARIA label for screen readers
   * @default "Loading"
   */
  label?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
}

/**
 * Spinner - Inline loading indicator
 *
 * Animated spinner component for loading states
 * Uses lucide-react Loader2 icon with rotation animation
 *
 * Accessibility:
 * - Includes aria-label for screen readers
 * - Uses role="status" for live region announcements
 *
 * @example
 * ```tsx
 * <Button disabled={isSubmitting}>
 *   {isSubmitting && <Spinner className="mr-2" />}
 *   {isSubmitting ? 'Creating...' : 'Create Project'}
 * </Button>
 * ```
 */
export function Spinner({ size = "default", className, label = "Loading" }: SpinnerProps) {
  return (
    <div role="status" aria-label={label}>
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
