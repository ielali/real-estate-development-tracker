/**
 * SpeedDialMenu Component
 * Story 10.7: Floating Action Button with Speed Dial
 *
 * Speed dial menu with staggered animations
 */

"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SpeedDialItem } from "./SpeedDialItem"
import type { SpeedDialOption } from "@/types/speed-dial"

export interface SpeedDialMenuProps {
  /**
   * Array of speed dial options to display
   */
  options: SpeedDialOption[]
  /**
   * Whether the menu is open
   */
  isOpen: boolean
  /**
   * Callback when an option is selected
   */
  onOptionSelect: (option: SpeedDialOption) => void
  /**
   * Callback when menu should close
   */
  onClose: () => void
}

/**
 * Animation variants for staggered menu items
 * AC #7: 50ms delay between each item
 */
const containerVariants = {
  open: {
    transition: {
      staggerChildren: 0.05, // 50ms delay between items
      delayChildren: 0.05,
    },
  },
  closed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1, // Reverse order when closing
    },
  },
}

/**
 * SpeedDialMenu - Displays menu items with staggered animations
 *
 * Positioned above the FAB and displays options in a vertical stack.
 * Features staggered animations, keyboard navigation, and focus management.
 *
 * Accessibility:
 * - Focus trap when open
 * - Escape key to close
 * - Arrow key navigation
 * - Proper ARIA attributes
 */
export function SpeedDialMenu({ options, isOpen, onOptionSelect, onClose }: SpeedDialMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)

  // Focus management - focus first item when menu opens
  useEffect(() => {
    if (isOpen && firstItemRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => {
        firstItemRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes menu
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }

      // Arrow key navigation
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
        const items =
          menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')
        if (!items) return

        const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement)
        let nextIndex: number

        if (e.key === "ArrowUp") {
          nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1
        } else {
          nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1
        }

        items[nextIndex]?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          id="speed-dial-menu"
          role="menu"
          aria-label="Quick actions"
          variants={containerVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className={cn(
            // Positioning - above FAB
            "absolute bottom-full mb-4 left-1/2 -translate-x-1/2",
            // Layout
            "flex flex-col gap-3",
            // Spacing
            "pb-2",
            // Z-index to appear above backdrop
            "z-50"
          )}
        >
          {options.map((option, index) => (
            <SpeedDialItem
              key={option.id}
              option={option}
              onClick={() => onOptionSelect(option)}
              ref={index === 0 ? firstItemRef : undefined}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
