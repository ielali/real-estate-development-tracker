/**
 * SpeedDialItem Component
 * Story 10.7: Floating Action Button with Speed Dial
 *
 * Individual speed dial menu item with animation
 */

"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { SpeedDialOption } from "@/types/speed-dial"

export interface SpeedDialItemProps {
  /**
   * Speed dial option configuration
   */
  option: SpeedDialOption
  /**
   * Click handler
   */
  onClick: () => void
}

/**
 * Animation variants for individual menu items
 * AC #9: Smooth spring animations
 */
const itemVariants = {
  hidden: {
    scale: 0,
    opacity: 0,
    y: 20,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

/**
 * SpeedDialItem - Individual menu item with icon and label
 *
 * Animated menu item that appears with spring animation.
 * Features proper touch target sizing and accessibility.
 *
 * Touch target: 48x48px minimum (AC #9 - Accessibility)
 */
export const SpeedDialItem = forwardRef<HTMLButtonElement, SpeedDialItemProps>(
  ({ option, onClick }, ref) => {
    const Icon = option.icon

    return (
      <motion.button
        ref={ref}
        variants={itemVariants}
        onClick={onClick}
        role="menuitem"
        aria-label={option.description || option.label}
        className={cn(
          // Layout and sizing (48x48px minimum touch target)
          "flex items-center gap-3",
          "min-h-[48px] px-4 py-2",
          // Colors
          "bg-background text-foreground",
          "border border-border",
          // Shape
          "rounded-full",
          // Elevation
          "shadow-md hover:shadow-lg",
          // Transitions
          "transition-all duration-200",
          // Hover and active states
          "hover:bg-accent hover:scale-105",
          "active:scale-95",
          // Focus states
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          // Text
          "whitespace-nowrap"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-10 h-10",
            "bg-primary/10 text-primary",
            "rounded-full",
            "flex items-center justify-center",
            "shrink-0"
          )}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Label */}
        <span className="text-sm font-medium pr-2">{option.label}</span>
      </motion.button>
    )
  }
)

SpeedDialItem.displayName = "SpeedDialItem"
