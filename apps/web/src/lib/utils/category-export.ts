import type { Category } from "@/server/db/types"

interface CategoryExportData {
  projectName: string
  projectId: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  generated: Date
  breakdown: Array<{
    parentCategory: Category
    childCategories: Array<{
      category: Category
      totalSpent: number
      costCount: number
    }>
    totalSpent: number
    taxDeductibleTotal: number
    nonDeductibleTotal: number
  }>
}

/**
 * Escape CSV values to prevent formula injection
 *
 * Escapes leading =, +, -, @ characters that could be interpreted
 * as formulas in spreadsheet applications.
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }

  const str = String(value)

  // Check for formula injection characters at the start
  if (str.match(/^[=+\-@]/)) {
    return `'${str}` // Prefix with single quote to prevent formula execution
  }

  // Escape double quotes and wrap in quotes if contains comma or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Format currency amount from cents to dollars
 */
function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Format date for CSV export
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-AU")
}

/**
 * Generate CSV content from category export data
 *
 * Format:
 * - Header with project metadata
 * - Blank line
 * - Column headers
 * - Data rows grouped by parent category
 * - Footer with totals
 */
export function generateCategoryCsv(data: CategoryExportData): string {
  const lines: string[] = []

  // Header section
  lines.push("Real Estate Development Tracker - Category Report")
  lines.push(`Project:,${escapeCsvValue(data.projectName)}`)
  lines.push(`Date Range:,${formatDate(data.dateRange.start)} to ${formatDate(data.dateRange.end)}`)
  lines.push(`Generated:,${formatDate(data.generated)}`)
  lines.push("") // Blank line

  // Column headers
  lines.push(
    "Parent Category,Child Category,Amount (AUD),Tax Deductible,Tax Category,Notes,Cost Count"
  )

  // Calculate grand totals
  let grandTotal = 0
  let grandTaxDeductible = 0
  let grandNonDeductible = 0

  // Data rows
  data.breakdown.forEach((group) => {
    const parentName = escapeCsvValue(group.parentCategory.displayName)
    const parentTotal = formatCurrency(group.totalSpent)
    const taxDeductible =
      group.taxDeductibleTotal > 0 && group.nonDeductibleTotal > 0
        ? "Mixed"
        : group.taxDeductibleTotal > 0
          ? "Yes"
          : "No"
    const notes = escapeCsvValue(group.parentCategory.notes)
    const totalCosts = group.childCategories.reduce((sum, child) => sum + child.costCount, 0)

    // Parent category summary row
    lines.push(`${parentName},,${parentTotal},${taxDeductible},,${notes},${totalCosts}`)

    // Child category rows
    group.childCategories.forEach((child) => {
      const childName = escapeCsvValue(child.category.displayName)
      const childTotal = formatCurrency(child.totalSpent)
      const childTaxDeductible =
        child.category.taxDeductible === true
          ? "Yes"
          : child.category.taxDeductible === false
            ? "No"
            : "N/A"
      const childTaxCategory = escapeCsvValue(child.category.taxCategory ?? "N/A")
      const childNotes = escapeCsvValue(child.category.notes)
      const childCostCount = child.costCount

      lines.push(
        `,${childName},${childTotal},${childTaxDeductible},${childTaxCategory},${childNotes},${childCostCount}`
      )
    })

    // Blank line after each parent group
    lines.push("")

    // Update grand totals
    grandTotal += group.totalSpent
    grandTaxDeductible += group.taxDeductibleTotal
    grandNonDeductible += group.nonDeductibleTotal
  })

  // Footer with totals
  lines.push(`TOTAL:,,$${formatCurrency(grandTotal)}`)
  lines.push(`Tax Deductible Total:,,$${formatCurrency(grandTaxDeductible)}`)
  lines.push(`Non-Deductible Total:,,$${formatCurrency(grandNonDeductible)}`)

  return lines.join("\n")
}

/**
 * Download CSV file to user's computer
 *
 * Creates a Blob and triggers browser download via temporary anchor element
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Create blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Cleanup
  URL.revokeObjectURL(url)
}

/**
 * Generate and download category report CSV
 *
 * Convenience function that combines CSV generation and download
 */
export function exportCategoryReport(data: CategoryExportData): void {
  const csv = generateCategoryCsv(data)
  const timestamp = new Date().toISOString().split("T")[0] // YYYY-MM-DD
  const filename = `${data.projectName.replace(/[^a-z0-9]/gi, "_")}_category_report_${timestamp}.csv`

  downloadCsv(csv, filename)
}
