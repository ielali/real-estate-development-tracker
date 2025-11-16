/**
 * Export utilities for cost data
 *
 * Provides functionality to export cost data to various formats
 */

import { formatCurrency } from "./cost-calculations"

export interface ExportCost {
  description: string
  category: string
  contact?: string | null
  date: string
  amount: number
}

/**
 * Export costs to CSV format
 * @param costs Array of cost items to export
 * @param projectName Name of the project for filename
 * @param filterInfo Optional filter information to include in filename
 */
export function exportCostsToCSV(
  costs: ExportCost[],
  projectName: string,
  filterInfo?: string
): void {
  // CSV headers
  const headers = ["Description", "Category", "Vendor/Contact", "Date", "Amount"]

  // Convert costs to CSV rows
  const rows = costs.map((cost) => [
    escapeCSV(cost.description),
    escapeCSV(cost.category),
    escapeCSV(cost.contact || ""),
    formatDate(cost.date),
    formatAmountForCSV(cost.amount),
  ])

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
    "",
    // Add summary row
    "Total",
    "",
    "",
    "",
    formatAmountForCSV(costs.reduce((sum, cost) => sum + cost.amount, 0)),
  ].join("\n")

  // Generate filename
  const timestamp = new Date().toISOString().split("T")[0]
  const filterSuffix = filterInfo ? `-${filterInfo}` : ""
  const filename = `${sanitizeFilename(projectName)}-costs${filterSuffix}-${timestamp}.csv`

  // Create and download file
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;")
}

/**
 * Export selected costs to CSV (for bulk export)
 * @param costs Array of selected cost items
 * @param projectName Name of the project
 */
export function exportSelectedCostsToCSV(costs: ExportCost[], projectName: string): void {
  exportCostsToCSV(costs, projectName, "selected")
}

/**
 * Escape CSV field value
 * @param value Field value
 * @returns Escaped value wrapped in quotes if needed
 */
function escapeCSV(value: string): string {
  // If value contains comma, quotes, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format date for CSV export
 * @param dateString Date string in ISO format
 * @returns Formatted date string (DD/MM/YYYY)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format amount for CSV export
 * @param amount Amount in cents
 * @returns Formatted amount with currency symbol
 */
function formatAmountForCSV(amount: number): string {
  return formatCurrency(amount, true)
}

/**
 * Sanitize filename by removing invalid characters
 * @param filename Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

/**
 * Download file to user's device
 * @param content File content
 * @param filename Filename for download
 * @param mimeType MIME type
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}
