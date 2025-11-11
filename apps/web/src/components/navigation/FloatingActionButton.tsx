/**
 * FloatingActionButton Component
 * Story 10.7: Floating Action Button with Speed Dial
 *
 * FAB with speed dial menu for quick access to create actions
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Camera, DollarSign, CheckSquare, FileText, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { SpeedDialMenu } from "./SpeedDialMenu"
import { useSpeedDialActions } from "@/hooks/useSpeedDialActions"
import type { SpeedDialOption } from "@/types/speed-dial"

export interface FloatingActionButtonProps {
  /**
   * Callback when FAB is tapped (for haptic feedback)
   */
  onTap?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Speed dial options configuration
 * Maps each option to its action, icon, and routing/modal behavior
 */
export const speedDialOptions: SpeedDialOption[] = [
  {
    id: "photo",
    icon: Camera,
    label: "Photo",
    action: "capture-photo",
    description: "Take a photo",
  },
  {
    id: "cost",
    icon: DollarSign,
    label: "Cost",
    action: "add-cost",
    description: "Add project cost",
  },
  {
    id: "task",
    icon: CheckSquare,
    label: "Task",
    action: "add-task",
    description: "Create a task",
  },
  {
    id: "document",
    icon: FileText,
    label: "Document",
    action: "upload-document",
    description: "Upload document",
  },
  {
    id: "note",
    icon: StickyNote,
    label: "Note",
    action: "add-note",
    description: "Add a note",
  },
]

/**
 * FloatingActionButton - Main FAB with speed dial menu
 *
 * Displays a floating action button in the center of the bottom tab bar.
 * When tapped, reveals a speed dial menu with quick action options.
 *
 * Features:
 * - Smooth animation for FAB icon rotation (+ to X)
 * - Backdrop overlay when open
 * - Staggered animation for speed dial items
 * - Keyboard navigation and accessibility
 */
export function FloatingActionButton({ onTap, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { handleAction } = useSpeedDialActions()

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
    onTap?.()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleOptionSelect = (option: SpeedDialOption) => {
    // Close the speed dial after selection
    setIsOpen(false)
    // Trigger the action handler
    handleAction(option)
  }

  return (
    <>
      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-0 z-40",
              "bg-black/50 backdrop-blur-sm",
              "md:hidden" // Mobile only
            )}
            onClick={handleClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn("relative", className)}>
        {/* Speed Dial Menu */}
        <SpeedDialMenu
          options={speedDialOptions}
          isOpen={isOpen}
          onOptionSelect={handleOptionSelect}
          onClose={handleClose}
        />

        {/* FAB Button */}
        <button
          onClick={handleToggle}
          className={cn(
            // Positioning (relative to parent)
            "relative -top-4",
            // Size and shape
            "w-14 h-14 rounded-full",
            // Colors
            "bg-primary text-primary-foreground",
            // Elevation
            "shadow-lg hover:shadow-xl",
            // Layout
            "flex items-center justify-center",
            // Transitions
            "transition-all duration-200",
            // Press animation
            "active:scale-95",
            // Focus states
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label={isOpen ? "Close menu" : "Open quick actions menu"}
          aria-expanded={isOpen}
          aria-controls="speed-dial-menu"
          aria-haspopup="menu"
        >
          {/* Animated Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {isOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Plus className="w-6 h-6" aria-hidden="true" />
            )}
          </motion.div>
        </button>
      </div>
    </>
  )
}
