/**
 * CostSummaryCard Component
 *
 * Displays a financial summary metric with icon, value, and status indicator
 * Used in project costs dashboard for budget tracking
 *
 * Features:
 * - Icon badge with colored background
 * - Large value display
 * - Optional status indicator with colored dot
 * - Dark mode support
 * - Accessible with proper ARIA labels
 */

export interface CostSummaryCardProps {
  /**
   * Card title (e.g., "Total Budget")
   */
  title: string
  /**
   * Main value to display (e.g., "$50,000")
   */
  value: string
  /**
   * Subtitle or additional info
   */
  subtitle: string
  /**
   * Material Symbols icon name
   */
  icon: string
  /**
   * Background color classes for icon badge
   */
  iconBgColor: string
  /**
   * Text color classes for icon
   */
  iconColor: string
  /**
   * Optional status indicator
   */
  statusDot?: {
    /** Color classes for status dot and text */
    color: string
    /** Status text to display */
    text: string
  }
  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string
}

export function CostSummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  statusDot,
  ariaLabel,
}: CostSummaryCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors"
      role="article"
      aria-label={ariaLabel || `${title}: ${value}`}
    >
      {/* Icon Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex items-center justify-center w-12 h-12 ${iconBgColor} rounded-xl transition-colors`}
          aria-hidden="true"
        >
          <span className={`material-symbols-outlined ${iconColor} text-2xl`}>{icon}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide break-words">
        {title}
      </p>

      {/* Value */}
      <p className="text-3xl font-black text-[#333333] dark:text-white mt-2" aria-live="polite">
        {value}
      </p>

      {/* Status Indicator or Subtitle */}
      {statusDot ? (
        <div
          className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${statusDot.color}`}
          role="status"
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${statusDot.color.replace("text-", "bg-")}`}
            aria-hidden="true"
          ></span>
          {statusDot.text}
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>
      )}
    </div>
  )
}
