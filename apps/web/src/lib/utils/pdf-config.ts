/**
 * PDF Report Configuration
 *
 * Provides configuration settings for professional PDF report generation
 * using @react-pdf/renderer. Defines standard page settings, styles,
 * colors, and fonts for investor-grade reports.
 */

import { StyleSheet } from "@react-pdf/renderer"

/**
 * Standard page dimensions for PDF reports
 * Using A4 size (8.5" x 11") with consistent margins
 */
export const PDF_PAGE_CONFIG = {
  size: "A4" as const,
  orientation: "portrait" as const,
  margins: {
    top: 30,
    right: 30,
    bottom: 40, // Extra space for footer
    left: 30,
  },
}

/**
 * Brand colors for report styling
 * Matches application design system
 */
export const PDF_COLORS = {
  // Primary colors
  primary: "#3b82f6", // blue-500
  primaryDark: "#1e40af", // blue-800
  primaryLight: "#93c5fd", // blue-300

  // Text colors
  textPrimary: "#1f2937", // gray-800
  textSecondary: "#6b7280", // gray-500
  textMuted: "#9ca3af", // gray-400

  // Background colors
  backgroundLight: "#f9fafb", // gray-50
  backgroundMedium: "#f3f4f6", // gray-100

  // Border colors
  border: "#e5e7eb", // gray-200
  borderDark: "#d1d5db", // gray-300

  // Status colors
  success: "#10b981", // green-500
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500

  // Chart colors (for data visualization)
  chart: [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // green
    "#06b6d4", // cyan
    "#f97316", // orange
    "#6366f1", // indigo
  ],
}

/**
 * Watermark configuration for partner reports
 */
export const PDF_WATERMARK = {
  text: "PARTNER VIEW",
  fontSize: 60,
  color: "#e5e7eb", // gray-200, subtle watermark
  opacity: 0.3,
  rotation: -45,
}

/**
 * Standard PDF styles using StyleSheet
 * Provides consistent styling across all report sections
 */
export const pdfStyles = StyleSheet.create({
  // Page structure
  page: {
    paddingTop: PDF_PAGE_CONFIG.margins.top,
    paddingRight: PDF_PAGE_CONFIG.margins.right,
    paddingBottom: PDF_PAGE_CONFIG.margins.bottom,
    paddingLeft: PDF_PAGE_CONFIG.margins.left,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: PDF_COLORS.textPrimary,
    backgroundColor: "#ffffff",
  },

  // Cover page
  coverPage: {
    paddingTop: PDF_PAGE_CONFIG.margins.top,
    paddingRight: PDF_PAGE_CONFIG.margins.right,
    paddingBottom: PDF_PAGE_CONFIG.margins.bottom,
    paddingLeft: PDF_PAGE_CONFIG.margins.left,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  coverLogo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },

  coverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: PDF_COLORS.primary,
    marginBottom: 10,
    textAlign: "center",
  },

  coverSubtitle: {
    fontSize: 18,
    color: PDF_COLORS.textSecondary,
    marginBottom: 30,
    textAlign: "center",
  },

  coverMeta: {
    fontSize: 11,
    color: PDF_COLORS.textMuted,
    marginTop: 5,
    textAlign: "center",
  },

  // Headers
  pageHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: PDF_COLORS.primaryDark,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.primary,
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: PDF_COLORS.textPrimary,
    marginTop: 15,
    marginBottom: 10,
  },

  subsectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: PDF_COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 5,
  },

  // Text styles
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
  },

  textBold: {
    fontWeight: "bold",
  },

  textMuted: {
    color: PDF_COLORS.textMuted,
  },

  textSmall: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
  },

  // Layout containers
  section: {
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    marginBottom: 5,
  },

  column: {
    flexDirection: "column",
  },

  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Tables
  table: {
    display: "flex",
    width: "auto",
    marginTop: 10,
    marginBottom: 10,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.primary,
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    padding: 8,
    fontSize: 9,
  },

  tableRowAlternate: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 8,
    fontSize: 9,
  },

  tableCell: {
    flex: 1,
    textAlign: "left",
  },

  tableCellRight: {
    flex: 1,
    textAlign: "right",
  },

  tableCellCenter: {
    flex: 1,
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
  },

  footerText: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
  },

  // Metrics cards
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  metricCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.backgroundLight,
    padding: 12,
    marginRight: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.primary,
  },

  metricLabel: {
    fontSize: 9,
    color: PDF_COLORS.textSecondary,
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: PDF_COLORS.primaryDark,
  },

  // Watermark
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: PDF_WATERMARK.fontSize,
    color: PDF_WATERMARK.color,
    opacity: PDF_WATERMARK.opacity,
    transform: `translate(-50%, -50%) rotate(${PDF_WATERMARK.rotation}deg)`,
    fontWeight: "bold",
  },

  // Chart placeholder
  chartContainer: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: PDF_COLORS.backgroundLight,
    borderRadius: 4,
  },

  chartTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
})

/**
 * Format file size for display in reports
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB", "234 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Generate confidentiality notice for report footer
 *
 * @param isPartnerView - Whether this is a partner view report
 * @returns Confidentiality notice text
 */
export function getConfidentialityNotice(isPartnerView: boolean): string {
  const baseNotice = "Confidential - For Authorized Use Only"
  return isPartnerView ? `${baseNotice} | Partner View` : baseNotice
}
