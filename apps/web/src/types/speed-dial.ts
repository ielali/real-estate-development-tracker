/**
 * Speed Dial Types
 * Story 10.7: Floating Action Button with Speed Dial
 */

import type { LucideIcon } from "lucide-react"

/**
 * Action types for speed dial options
 */
export type SpeedDialAction =
  | "capture-photo"
  | "add-cost"
  | "add-task"
  | "upload-document"
  | "add-note"

/**
 * Speed dial menu option configuration
 */
export interface SpeedDialOption {
  /**
   * Unique identifier for the option
   */
  id: string
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon
  /**
   * Display label
   */
  label: string
  /**
   * Action type to trigger
   */
  action: SpeedDialAction
  /**
   * Optional description for accessibility
   */
  description?: string
  /**
   * Optional route to navigate to (alternative to modal)
   */
  route?: string
  /**
   * Optional modal component name to open
   */
  modal?: string
}
