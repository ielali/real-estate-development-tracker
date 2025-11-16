/**
 * FilledIcon Component
 * Story 10.14: Icon System - Lucide Filled Wrapper
 *
 * Wrapper component for Lucide React icons that provides filled/outline variants.
 * Simulates Material Symbols filled state using strokeWidth + fill + fillOpacity.
 *
 * Usage:
 * ```tsx
 * import { Home } from '@/components/icons'
 * import { FilledIcon } from '@/components/icons'
 *
 * <FilledIcon
 *   icon={Home}
 *   filled={isActive}
 *   className="w-5 h-5"
 *   aria-hidden="true"
 * />
 * ```
 *
 * Visual Effect:
 * - filled=true: strokeWidth 2.5, currentColor fill with 20% opacity
 * - filled=false: strokeWidth 2, no fill (standard Lucide outline)
 *
 * Accessibility:
 * - Use aria-hidden="true" for decorative icons (next to labels)
 * - Omit aria-hidden for icon-only buttons (provide aria-label on parent)
 */

import { type LucideIcon } from "lucide-react"

export interface FilledIconProps extends React.SVGProps<SVGSVGElement> {
  /** Lucide icon component to render */
  icon: LucideIcon
  /** Whether to show filled variant (active state) */
  filled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * FilledIcon wrapper for Lucide React icons
 *
 * Provides filled/outline visual distinction for active/inactive navigation states.
 * Uses strokeWidth + fill + fillOpacity to approximate Material Symbols filled effect.
 *
 * @param icon - Lucide icon component (e.g., Home, FolderKanban)
 * @param filled - Show filled variant (true = active, false = inactive)
 * @param className - CSS classes for sizing and positioning (e.g., "w-5 h-5")
 * @param props - Additional SVG props (aria-hidden, aria-label, etc.)
 */
export function FilledIcon({ icon: Icon, filled = false, className, ...props }: FilledIconProps) {
  return (
    <Icon
      className={className}
      strokeWidth={filled ? 2.5 : 2}
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.2 : 0}
      {...props}
    />
  )
}
