"use client"

/**
 * StarRating Component
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Interactive and read-only star rating display
 * Features:
 * - 1-5 star rating (no half-stars)
 * - Interactive mode with click and keyboard navigation
 * - Read-only display mode
 * - Accessible with ARIA labels and screen reader support
 * - Hover state with visual feedback
 */

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  className,
  size = "md",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const isInteractive = !readonly && onChange

  const handleClick = (rating: number) => {
    if (isInteractive) {
      onChange(rating)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (!isInteractive) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange(rating)
    } else if (event.key === "ArrowLeft" && rating > 1) {
      event.preventDefault()
      onChange(rating - 1)
    } else if (event.key === "ArrowRight" && rating < 5) {
      event.preventDefault()
      onChange(rating + 1)
    }
  }

  const displayValue = hoverValue ?? value

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`Rating: ${value} out of 5 stars`}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayValue
        const isHovered = hoverValue !== null && rating <= hoverValue

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => isInteractive && setHoverValue(rating)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={!isInteractive}
            role={isInteractive ? "radio" : undefined}
            aria-checked={isInteractive ? rating === value : undefined}
            aria-label={`${rating} star${rating !== 1 ? "s" : ""}`}
            className={cn(
              "transition-all duration-150",
              isInteractive && "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded",
              !isInteractive && "cursor-default"
            )}
            tabIndex={isInteractive ? 0 : -1}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                isFilled && !isHovered && "fill-yellow-400 text-yellow-400",
                isFilled && isHovered && "fill-yellow-500 text-yellow-500",
                !isFilled && "fill-none text-gray-300"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
