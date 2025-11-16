/**
 * Centralized Category Configuration
 *
 * Single source of truth for all category colors and styling
 * Used by CategoryBadge, charts, and other visualizations
 *
 * Matches actual database category display names from update_cost_categories.sql
 */

export interface CategoryColorScheme {
  badge: {
    light: string // Tailwind classes for light mode badge
    dark: string // Tailwind classes for dark mode badge
  }
  chart: {
    light: string // RGBA color for light mode charts
    dark: string // RGBA color for dark mode charts
  }
}

/**
 * Complete category color configuration
 * Each category has both badge classes (for UI components) and chart colors (for data viz)
 */
export const CATEGORY_CONFIG: Record<string, CategoryColorScheme> = {
  // Hard Costs
  "Hard Costs": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  "Site Preparation": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  Demolition: {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(239, 68, 68, 0.8)", dark: "rgba(248, 113, 113, 0.8)" },
  },
  "Foundation & Structural": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  "Construction Materials": {
    badge: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/30 text-purple-300" },
    chart: { light: "rgba(168, 85, 247, 0.8)", dark: "rgba(192, 132, 252, 0.8)" },
  },
  "Labor & Trades": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  Electrical: {
    badge: { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/30 text-yellow-300" },
    chart: { light: "rgba(234, 179, 8, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  Plumbing: {
    badge: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-900/30 text-cyan-300" },
    chart: { light: "rgba(6, 182, 212, 0.8)", dark: "rgba(34, 211, 238, 0.8)" },
  },
  HVAC: {
    badge: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-300" },
    chart: { light: "rgba(99, 102, 241, 0.8)", dark: "rgba(129, 140, 248, 0.8)" },
  },
  Carpentry: {
    badge: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/30 text-amber-300" },
    chart: { light: "rgba(245, 158, 11, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  Painting: {
    badge: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900/30 text-pink-300" },
    chart: { light: "rgba(236, 72, 153, 0.8)", dark: "rgba(244, 114, 182, 0.8)" },
  },
  Roofing: {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(100, 116, 139, 0.8)", dark: "rgba(148, 163, 184, 0.8)" },
  },
  Flooring: {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },
  "Landscaping & External Works": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Site Improvements": {
    badge: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-300" },
    chart: { light: "rgba(16, 185, 129, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Specialty Work": {
    badge: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-900/30 text-violet-300" },
    chart: { light: "rgba(139, 92, 246, 0.8)", dark: "rgba(167, 139, 250, 0.8)" },
  },
  "Hard Cost Contingency": {
    badge: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
    chart: { light: "rgba(239, 68, 68, 0.8)", dark: "rgba(248, 113, 113, 0.8)" },
  },

  // Pre-Development
  "Pre-Development": {
    badge: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-300" },
    chart: { light: "rgba(99, 102, 241, 0.8)", dark: "rgba(129, 140, 248, 0.8)" },
  },
  "Land Acquisition": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  "Feasibility Studies": {
    badge: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/30 text-purple-300" },
    chart: { light: "rgba(168, 85, 247, 0.8)", dark: "rgba(192, 132, 252, 0.8)" },
  },
  "Market Research": {
    badge: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900/30 text-pink-300" },
    chart: { light: "rgba(236, 72, 153, 0.8)", dark: "rgba(244, 114, 182, 0.8)" },
  },
  "Due Diligence": {
    badge: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-300" },
    chart: { light: "rgba(99, 102, 241, 0.8)", dark: "rgba(129, 140, 248, 0.8)" },
  },
  "Environmental Assessments": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Geotechnical Investigations": {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(100, 116, 139, 0.8)", dark: "rgba(148, 163, 184, 0.8)" },
  },

  // Professional Fees
  "Professional Fees": {
    badge: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-300" },
    chart: { light: "rgba(99, 102, 241, 0.8)", dark: "rgba(129, 140, 248, 0.8)" },
  },
  "Architectural Design": {
    badge: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/30 text-purple-300" },
    chart: { light: "rgba(168, 85, 247, 0.8)", dark: "rgba(192, 132, 252, 0.8)" },
  },
  "Engineering Fees": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  "Town Planning": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Quantity Surveyor": {
    badge: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-300" },
    chart: { light: "rgba(99, 102, 241, 0.8)", dark: "rgba(129, 140, 248, 0.8)" },
  },
  "Project Management": {
    badge: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-900/30 text-violet-300" },
    chart: { light: "rgba(139, 92, 246, 0.8)", dark: "rgba(167, 139, 250, 0.8)" },
  },
  "Legal Fees": {
    badge: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
    chart: { light: "rgba(239, 68, 68, 0.8)", dark: "rgba(248, 113, 113, 0.8)" },
  },
  "Accounting Fees": {
    badge: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-900/30 text-cyan-300" },
    chart: { light: "rgba(6, 182, 212, 0.8)", dark: "rgba(34, 211, 238, 0.8)" },
  },

  // Government Charges & Taxes
  "Government Charges & Taxes": {
    badge: { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/30 text-yellow-300" },
    chart: { light: "rgba(234, 179, 8, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  "Stamp Duty": {
    badge: { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/30 text-yellow-300" },
    chart: { light: "rgba(234, 179, 8, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  GST: {
    badge: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/30 text-amber-300" },
    chart: { light: "rgba(245, 158, 11, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  "Infrastructure Charges": {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },
  "Developer Contributions": {
    badge: { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/30 text-yellow-300" },
    chart: { light: "rgba(234, 179, 8, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  "Council Rates & Land Tax": {
    badge: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/30 text-amber-300" },
    chart: { light: "rgba(245, 158, 11, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  "Permits & Application Fees": {
    badge: { light: "bg-yellow-100 text-yellow-700", dark: "bg-yellow-900/30 text-yellow-300" },
    chart: { light: "rgba(234, 179, 8, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },

  // Finance Costs
  "Finance Costs": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Loan Establishment Fees": {
    badge: { light: "bg-green-100 text-green-700", dark: "bg-green-900/30 text-green-300" },
    chart: { light: "rgba(34, 197, 94, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Interest Payments": {
    badge: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-300" },
    chart: { light: "rgba(16, 185, 129, 0.8)", dark: "rgba(52, 211, 153, 0.8)" },
  },
  "Bank Guarantee Fees": {
    badge: { light: "bg-teal-100 text-teal-700", dark: "bg-teal-900/30 text-teal-300" },
    chart: { light: "rgba(20, 184, 166, 0.8)", dark: "rgba(45, 212, 191, 0.8)" },
  },
  "Valuation Fees": {
    badge: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-900/30 text-cyan-300" },
    chart: { light: "rgba(6, 182, 212, 0.8)", dark: "rgba(34, 211, 238, 0.8)" },
  },

  // Insurance
  Insurance: {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },
  "Builders Risk Insurance": {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },
  "Public Liability Insurance": {
    badge: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
    chart: { light: "rgba(239, 68, 68, 0.8)", dark: "rgba(248, 113, 113, 0.8)" },
  },
  "Professional Indemnity": {
    badge: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/30 text-amber-300" },
    chart: { light: "rgba(245, 158, 11, 0.8)", dark: "rgba(251, 191, 36, 0.8)" },
  },
  "Contract Works Insurance": {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },

  // Marketing & Sales
  "Marketing & Sales": {
    badge: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900/30 text-pink-300" },
    chart: { light: "rgba(236, 72, 153, 0.8)", dark: "rgba(244, 114, 182, 0.8)" },
  },
  "Marketing & Advertising": {
    badge: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900/30 text-pink-300" },
    chart: { light: "rgba(236, 72, 153, 0.8)", dark: "rgba(244, 114, 182, 0.8)" },
  },
  "Sales Agent Commission": {
    badge: { light: "bg-fuchsia-100 text-fuchsia-700", dark: "bg-fuchsia-900/30 text-fuchsia-300" },
    chart: { light: "rgba(217, 70, 239, 0.8)", dark: "rgba(232, 121, 249, 0.8)" },
  },
  "Display Suite/Home": {
    badge: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/30 text-purple-300" },
    chart: { light: "rgba(168, 85, 247, 0.8)", dark: "rgba(192, 132, 252, 0.8)" },
  },
  "Signage & Branding": {
    badge: { light: "bg-pink-100 text-pink-700", dark: "bg-pink-900/30 text-pink-300" },
    chart: { light: "rgba(236, 72, 153, 0.8)", dark: "rgba(244, 114, 182, 0.8)" },
  },

  // Other Soft Costs
  "Other Soft Costs": {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(100, 116, 139, 0.8)", dark: "rgba(148, 163, 184, 0.8)" },
  },
  "Equipment Rental": {
    badge: { light: "bg-gray-100 text-gray-700", dark: "bg-gray-800 text-gray-300" },
    chart: { light: "rgba(107, 114, 128, 0.8)", dark: "rgba(156, 163, 175, 0.8)" },
  },
  "Utilities & Services": {
    badge: { light: "bg-cyan-100 text-cyan-700", dark: "bg-cyan-900/30 text-cyan-300" },
    chart: { light: "rgba(6, 182, 212, 0.8)", dark: "rgba(34, 211, 238, 0.8)" },
  },
  "Temporary Services": {
    badge: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    chart: { light: "rgba(59, 130, 246, 0.8)", dark: "rgba(96, 165, 250, 0.8)" },
  },
  Security: {
    badge: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
    chart: { light: "rgba(239, 68, 68, 0.8)", dark: "rgba(248, 113, 113, 0.8)" },
  },
  "Soft Cost Contingency": {
    badge: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    chart: { light: "rgba(249, 115, 22, 0.8)", dark: "rgba(251, 146, 60, 0.8)" },
  },
  "Developer Fees & Overhead": {
    badge: { light: "bg-violet-100 text-violet-700", dark: "bg-violet-900/30 text-violet-300" },
    chart: { light: "rgba(139, 92, 246, 0.8)", dark: "rgba(167, 139, 250, 0.8)" },
  },

  // Fallback
  Other: {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(100, 116, 139, 0.8)", dark: "rgba(148, 163, 184, 0.8)" },
  },
  Uncategorized: {
    badge: { light: "bg-slate-100 text-slate-700", dark: "bg-slate-800 text-slate-300" },
    chart: { light: "rgba(100, 116, 139, 0.8)", dark: "rgba(148, 163, 184, 0.8)" },
  },
}

/**
 * Get badge classes for a category in the current theme
 * @param categoryName Category display name
 * @param isDark Whether dark mode is active
 * @returns Tailwind CSS classes string
 */
export function getCategoryBadgeClasses(categoryName: string, isDark: boolean): string {
  const config = CATEGORY_CONFIG[categoryName] || CATEGORY_CONFIG.Other
  return isDark ? `dark:${config.badge.dark}` : config.badge.light
}

/**
 * Get chart color for a category in the current theme
 * @param categoryName Category display name
 * @param isDark Whether dark mode is active
 * @returns RGBA color string
 */
export function getCategoryChartColor(categoryName: string, isDark: boolean): string {
  const config = CATEGORY_CONFIG[categoryName] || CATEGORY_CONFIG.Other
  return isDark ? config.chart.dark : config.chart.light
}
