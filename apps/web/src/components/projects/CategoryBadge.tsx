import { CATEGORY_CONFIG } from "@/lib/category-config"

/**
 * CategoryBadge Component
 *
 * Displays a category name with distinct color coding
 * Used in cost tables and lists for visual category identification
 *
 * Features:
 * - Color-coded badges per category type
 * - Dark mode support with adjusted opacity
 * - Accessible with semantic HTML
 * - Uses centralized category configuration
 */

export interface CategoryBadgeProps {
  /**
   * Category display name
   */
  category: string
  /**
   * Additional CSS classes
   */
  className?: string
}

export function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other
  const lightClasses = config.badge.light
  const darkClasses = config.badge.dark

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${lightClasses} dark:${darkClasses} ${className}`}
      role="status"
      aria-label={`Category: ${category}`}
    >
      {category}
    </span>
  )
}
