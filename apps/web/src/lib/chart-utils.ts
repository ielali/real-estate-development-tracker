import { getCategoryChartColor } from "./category-config"

/**
 * Chart theming and color utilities for Recharts integration
 *
 * Provides consistent theming across all charts with dark mode support
 */

export interface ChartTheme {
  textColor: string
  gridColor: string
  backgroundColor: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
}

/**
 * Get chart theme colors based on dark mode state
 * @param isDark Whether dark mode is active
 * @returns Theme object with all color values
 */
export function getChartTheme(isDark: boolean): ChartTheme {
  return {
    textColor: isDark ? "#cbd5e1" : "#333333",
    gridColor: isDark ? "#334155" : "#e2e8f0",
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#475569" : "#e2e8f0",
    tooltipText: isDark ? "#f1f5f9" : "#333333",
  }
}

/**
 * Get color for a category in current theme
 * Uses centralized category configuration from category-config.ts
 *
 * @param categoryName Category display name
 * @param isDark Whether dark mode is active
 * @returns RGBA color string
 */
export function getCategoryColor(categoryName: string, isDark: boolean): string {
  return getCategoryChartColor(categoryName, isDark)
}

/**
 * Default chart colors for generic use cases
 */
export const defaultChartColors = {
  primary: { light: "#0c1e3d", dark: "#60a5fa" }, // Navy / Blue
  secondary: { light: "#f97316", dark: "#fb923c" }, // Orange
  success: { light: "#10b981", dark: "#34d399" }, // Green
  warning: { light: "#eab308", dark: "#fbbf24" }, // Yellow
  danger: { light: "#ef4444", dark: "#f87171" }, // Red
}

/**
 * Format Y-axis tick values as currency
 * @param value Tick value in cents
 * @returns Formatted currency string
 */
export function formatCurrencyTick(value: number): string {
  const dollars = value / 100
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`
  } else if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(0)}K`
  }
  return `$${dollars.toFixed(0)}`
}

/**
 * Format tooltip currency values
 * @param value Value in cents
 * @returns Formatted currency string
 */
export function formatTooltipCurrency(value: number): string {
  const dollars = value / 100
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/**
 * Format month labels for X-axis
 * @param monthString Month in YYYY-MM format
 * @returns Formatted month label (e.g., "Jan 2024")
 */
export function formatMonthLabel(monthString: string): string {
  const [year, month] = monthString.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
  })
}
