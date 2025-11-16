import Decimal from "decimal.js"

/**
 * Cost calculation utilities for financial analysis
 *
 * Uses Decimal.js for precise financial calculations to avoid floating point errors
 */

export interface CostItem {
  amount: number
  category?: {
    id: string
    displayName: string
  }
  date: Date
}

export interface CostSummary {
  totalBudget: number
  totalSpent: number
  remaining: number
  variance: number
  percentSpent: number
}

/**
 * Calculate financial summary from costs and project budget
 * @param costs Array of cost items
 * @param projectBudget Total project budget in cents
 * @returns Summary with all calculations
 */
export function calculateCostSummary(costs: CostItem[], projectBudget: number | null): CostSummary {
  const totalBudget = new Decimal(projectBudget ?? 0)

  const totalSpent = costs.reduce((sum, cost) => sum.plus(new Decimal(cost.amount)), new Decimal(0))

  const remaining = totalBudget.minus(totalSpent)
  const variance = totalSpent.minus(totalBudget)

  const percentSpent = totalBudget.isZero()
    ? new Decimal(0)
    : totalSpent.dividedBy(totalBudget).times(100)

  return {
    totalBudget: totalBudget.toNumber(),
    totalSpent: totalSpent.toNumber(),
    remaining: remaining.toNumber(),
    variance: variance.toNumber(),
    percentSpent: percentSpent.toDecimalPlaces(1).toNumber(),
  }
}

/**
 * Get budget status based on percent spent
 * @param percentSpent Percentage of budget spent
 * @returns Status: "good" | "warning" | "over"
 */
export function getBudgetStatus(percentSpent: number): "good" | "warning" | "over" {
  if (percentSpent < 80) return "good"
  if (percentSpent < 100) return "warning"
  return "over"
}

/**
 * Get status color classes for Tailwind
 * @param status Budget status
 * @returns Tailwind color classes
 */
export function getStatusColor(status: "good" | "warning" | "over"): {
  text: string
  bg: string
  dot: string
} {
  switch (status) {
    case "good":
      return {
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        dot: "bg-green-600 dark:bg-green-400",
      }
    case "warning":
      return {
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        dot: "bg-orange-600 dark:bg-orange-400",
      }
    case "over":
      return {
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        dot: "bg-red-600 dark:bg-red-400",
      }
  }
}

/**
 * Format currency amount
 * @param amount Amount in cents
 * @param includeCents Whether to show cents (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeCents = true): string {
  const dollars = amount / 100
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  }).format(dollars)
}

/**
 * Aggregate costs by category
 * @param costs Array of cost items
 * @returns Map of category ID to total amount
 */
export function aggregateByCategory(
  costs: CostItem[]
): Array<{ category: string; categoryId: string; total: number; count: number }> {
  const categoryMap = new Map<string, { name: string; total: Decimal; count: number }>()

  costs.forEach((cost) => {
    if (!cost.category) return

    const existing = categoryMap.get(cost.category.id)
    if (existing) {
      existing.total = existing.total.plus(new Decimal(cost.amount))
      existing.count++
    } else {
      categoryMap.set(cost.category.id, {
        name: cost.category.displayName,
        total: new Decimal(cost.amount),
        count: 1,
      })
    }
  })

  return Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
    category: data.name,
    categoryId,
    total: data.total.toNumber(),
    count: data.count,
  }))
}

/**
 * Aggregate costs by month for trend analysis
 * @param costs Array of cost items
 * @returns Array of monthly totals with cumulative spending
 */
export function aggregateByMonth(
  costs: CostItem[]
): Array<{ month: string; monthTotal: number; cumulative: number }> {
  // Sort costs by date
  const sortedCosts = [...costs].sort((a, b) => a.date.getTime() - b.date.getTime())

  const monthlyMap = new Map<string, Decimal>()

  sortedCosts.forEach((cost) => {
    const month = cost.date.toISOString().substring(0, 7) // YYYY-MM
    const existing = monthlyMap.get(month)
    if (existing) {
      monthlyMap.set(month, existing.plus(new Decimal(cost.amount)))
    } else {
      monthlyMap.set(month, new Decimal(cost.amount))
    }
  })

  // Calculate cumulative spending
  let cumulative = new Decimal(0)
  const result: Array<{ month: string; monthTotal: number; cumulative: number }> = []

  Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, total]) => {
      cumulative = cumulative.plus(total)
      result.push({
        month,
        monthTotal: total.toNumber(),
        cumulative: cumulative.toNumber(),
      })
    })

  return result
}
