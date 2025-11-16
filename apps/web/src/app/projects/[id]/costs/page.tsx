"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"
import { CostSummaryCard } from "@/components/projects/CostSummaryCard"
import { CostBreakdownChart } from "@/components/projects/CostBreakdownChart"
import { CategorySpendingChart } from "@/components/projects/CategorySpendingChart"
import { SpendingTrendChart } from "@/components/projects/SpendingTrendChart"
import { CategoryBadge } from "@/components/projects/CategoryBadge"
import {
  calculateCostSummary,
  getBudgetStatus,
  getStatusColor,
  formatCurrency,
  aggregateByCategory,
  aggregateByMonth,
} from "@/lib/cost-calculations"
import { exportCostsToCSV, exportSelectedCostsToCSV } from "@/lib/export-utils"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"
import { ChevronUpIcon, ChevronDownIcon, AlertCircle } from "lucide-react"
import { ErrorBoundary, type ErrorFallbackProps } from "@/components/error-boundary"

/**
 * ChartErrorFallback - Lightweight error UI for chart failures
 * Displays within chart card without breaking the page layout
 */
function ChartErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6">
      <AlertCircle className="h-12 w-12 text-red-500 mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Unable to load chart
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">
        {error.message || "An error occurred while rendering this chart"}
      </p>
      <button
        onClick={resetError}
        className="px-3 py-1.5 text-xs font-medium text-white bg-[#137fec] hover:bg-[#0d6bc9] rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

/**
 * Enhanced Project Costs Page
 * Story 10.17: Project Costs Screen Enhancement
 *
 * Features:
 * - Summary cards with budget tracking
 * - Interactive charts (breakdown, category spending, trend)
 * - Detailed cost table with sorting, filtering, searching
 * - Inline editing
 * - Bulk selection and actions
 * - CSV export
 * - Dark mode support
 * - Mobile responsive
 * - WCAG AA accessible
 */
export default function ProjectCostsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  // State management
  const [searchText, setSearchText] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortColumn, setSortColumn] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedCosts, setSelectedCosts] = useState<Set<string>>(new Set())
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>(null)

  // Debounce search for performance
  const debouncedSearch = useDebounce(searchText, 300)

  // Fetch project data
  const { data: project } = api.projects.getById.useQuery({ id: projectId })

  // Fetch all costs for this project
  const { data: costs = [], isLoading } = api.costs.list.useQuery({
    projectId,
    sortBy: "date",
    sortDirection: "desc",
  })

  // Fetch categories for filter dropdown
  const { data: categories = [] } = api.category.list.useQuery({
    type: "cost" as any,
  })

  // Calculate summary metrics
  const summary = useMemo(() => {
    return calculateCostSummary(costs, project?.totalBudget ?? null)
  }, [costs, project?.totalBudget])

  const budgetStatus = getBudgetStatus(summary.percentSpent)
  const statusColors = getStatusColor(budgetStatus)

  // Aggregate data for charts
  const categoryData = useMemo(() => aggregateByCategory(costs), [costs])
  const monthlyData = useMemo(() => aggregateByMonth(costs), [costs])

  // Filter and sort costs for table
  const filteredAndSortedCosts = useMemo(() => {
    let filtered = [...costs]

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((cost) => cost.category?.id === categoryFilter)
    }

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (cost) =>
          cost.description.toLowerCase().includes(searchLower) ||
          cost.contact?.firstName?.toLowerCase().includes(searchLower) ||
          cost.contact?.lastName?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortColumn) {
        case "description":
          aVal = a.description
          bVal = b.description
          break
        case "category":
          aVal = a.category?.displayName || ""
          bVal = b.category?.displayName || ""
          break
        case "contact":
          aVal = a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : ""
          bVal = b.contact ? `${b.contact.firstName} ${b.contact.lastName}` : ""
          break
        case "date":
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
          break
        case "amount":
          aVal = a.amount
          bVal = b.amount
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [costs, categoryFilter, debouncedSearch, sortColumn, sortDirection])

  // Get unique cost categories for filter
  const uniqueCategories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; displayName: string }>()
    costs.forEach((cost: (typeof costs)[0]) => {
      if (cost.category) {
        categoryMap.set(cost.category.id, cost.category)
      }
    })
    return Array.from(categoryMap.values())
  }, [costs])

  // Mutation hooks
  const utils = api.useUtils()
  const updateCostMutation = api.costs.update.useMutation({
    onSuccess: () => {
      utils.costs.list.invalidate()
      toast.success("Cost updated successfully")
      setEditingCostId(null)
      setEditFormData(null)
    },
    onError: (error) => {
      toast.error(`Failed to update cost: ${error.message}`)
    },
  })

  // Note: Delete functionality requires backend API implementation
  // const deleteCostMutation = api.costs.delete.useMutation({
  //   onSuccess: () => {
  //     utils.costs.list.invalidate()
  //     toast.success("Cost deleted successfully")
  //     setSelectedCosts(new Set())
  //   },
  //   onError: (error: any) => {
  //     toast.error(`Failed to delete cost: ${error.message}`)
  //   },
  // })

  // Event handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleSelectAll = () => {
    if (selectedCosts.size === filteredAndSortedCosts.length) {
      setSelectedCosts(new Set())
    } else {
      setSelectedCosts(new Set(filteredAndSortedCosts.map((c) => c.id)))
    }
  }

  const handleSelectCost = (costId: string) => {
    const newSelected = new Set(selectedCosts)
    if (newSelected.has(costId)) {
      newSelected.delete(costId)
    } else {
      newSelected.add(costId)
    }
    setSelectedCosts(newSelected)
  }

  const handleEditCost = (cost: (typeof costs)[0]) => {
    setEditingCostId(cost.id)
    setEditFormData({
      description: cost.description,
      categoryId: cost.category?.id,
      contactId: cost.contact?.id || null,
      amount: cost.amount,
      date: new Date(cost.date),
    })
  }

  const handleCancelEdit = () => {
    setEditingCostId(null)
    setEditFormData(null)
  }

  const handleSaveEdit = () => {
    if (!editingCostId || !editFormData) return

    updateCostMutation.mutate({
      id: editingCostId,
      ...editFormData,
    })
  }

  const handleExportAll = () => {
    const exportData = filteredAndSortedCosts.map((cost) => ({
      description: cost.description,
      category: cost.category?.displayName || "Uncategorized",
      contact: cost.contact ? `${cost.contact.firstName} ${cost.contact.lastName}` : null,
      date: cost.date.toISOString(),
      amount: cost.amount,
    }))

    exportCostsToCSV(
      exportData,
      project?.name || "project",
      categoryFilter !== "all" ? "filtered" : undefined
    )
    toast.success("Costs exported to CSV")
  }

  const handleExportSelected = () => {
    const selected = costs.filter((c: (typeof costs)[0]) => selectedCosts.has(c.id))
    const exportData = selected.map((cost: (typeof costs)[0]) => ({
      description: cost.description,
      category: cost.category?.displayName || "Uncategorized",
      contact: cost.contact ? `${cost.contact.firstName} ${cost.contact.lastName}` : null,
      date: cost.date.toISOString(),
      amount: cost.amount,
    }))

    exportSelectedCostsToCSV(exportData, project?.name || "project")
    toast.success(`${selected.length} costs exported to CSV`)
  }

  // Reserved for future implementation - prefixed with _ to indicate intentionally unused
  const _handleBulkDelete = () => {
    // Note: Delete functionality requires backend API implementation
    toast.error("Delete functionality is not yet implemented in the backend API")

    // if (selectedCosts.size === 0) return
    // if (!confirm(`Are you sure you want to delete ${selectedCosts.size} cost(s)?`)) {
    //   return
    // }
    // Promise.all(
    //   Array.from(selectedCosts).map((id) => deleteCostMutation.mutateAsync({ id }))
    // )
    //   .then(() => {
    //     toast.success(`Deleted ${selectedCosts.size} costs`)
    //     setSelectedCosts(new Set())
    //   })
    //   .catch(() => {
    //     toast.error("Failed to delete some costs")
    //   })
  }

  const handleBulkCategorize = (newCategoryId: string) => {
    if (selectedCosts.size === 0) return

    Promise.all(
      Array.from(selectedCosts).map((id) =>
        updateCostMutation.mutateAsync({ id, categoryId: newCategoryId })
      )
    )
      .then(() => {
        toast.success(`Updated ${selectedCosts.size} costs`)
        setSelectedCosts(new Set())
      })
      .catch(() => {
        toast.error("Failed to update some costs")
      })
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    )
  }

  if (isLoading || !project) {
    return (
      <div className="bg-[#f6f7f8] dark:bg-[#101922] min-h-screen">
        <div className="px-6 py-10 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading project costs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#101922] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 px-6 pt-6">
        <Breadcrumb items={breadcrumbHelpers.projectCosts(project.name, projectId)} />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#333333] dark:text-white tracking-tight">
                Project Costs
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {project.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">download</span>
                Export
              </button>
              <button
                onClick={() => router.push(`/projects/${projectId}/costs/new`)}
                className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#0A2540] hover:bg-[#0a2540e6] dark:bg-[#137fec] dark:hover:bg-[#0d6bc9] rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Add Cost
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <div className="px-6 py-6 max-w-7xl">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <CostSummaryCard
              title="Total Budget"
              value={formatCurrency(summary.totalBudget, false)}
              subtitle="Original estimate"
              icon="account_balance_wallet"
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              ariaLabel={`Total project budget: ${formatCurrency(summary.totalBudget)}`}
            />
            <CostSummaryCard
              title="Total Spent"
              value={formatCurrency(summary.totalSpent, false)}
              subtitle={`${summary.percentSpent.toFixed(1)}% of budget`}
              icon="payments"
              iconBgColor="bg-orange-100 dark:bg-orange-900/30"
              iconColor="text-orange-600 dark:text-orange-400"
              statusDot={
                summary.percentSpent > 0
                  ? {
                      color: statusColors.text,
                      text: `${summary.percentSpent.toFixed(1)}% of budget`,
                    }
                  : undefined
              }
              ariaLabel={`Total spent: ${formatCurrency(summary.totalSpent)}`}
            />
            <CostSummaryCard
              title="Remaining"
              value={formatCurrency(summary.remaining, false)}
              subtitle={`${(100 - summary.percentSpent).toFixed(1)}% available`}
              icon="check_circle"
              iconBgColor="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
              ariaLabel={`Remaining budget: ${formatCurrency(summary.remaining)}`}
            />
            <CostSummaryCard
              title="Variance"
              value={formatCurrency(Math.abs(summary.variance), false)}
              subtitle={
                summary.variance > 0
                  ? "Over budget"
                  : summary.variance < 0
                    ? "Under budget"
                    : "On budget"
              }
              icon="trending_up"
              iconBgColor={statusColors.bg}
              iconColor={statusColors.text}
              statusDot={
                summary.variance !== 0
                  ? {
                      color: statusColors.text,
                      text:
                        summary.variance > 0
                          ? `${Math.abs((summary.variance / summary.totalBudget) * 100).toFixed(1)}% over original`
                          : `${Math.abs((summary.variance / summary.totalBudget) * 100).toFixed(1)}% under original`,
                    }
                  : undefined
              }
              ariaLabel={`Budget variance: ${formatCurrency(Math.abs(summary.variance))}`}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cost Breakdown Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-[#333333] dark:text-white mb-6">
                Cost Breakdown by Category
              </h3>
              <ErrorBoundary fallback={ChartErrorFallback}>
                <CostBreakdownChart data={categoryData} height={320} />
              </ErrorBoundary>
            </div>

            {/* Budget Status Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-[#333333] dark:text-white mb-6">
                Budget Status by Category
              </h3>
              <ErrorBoundary fallback={ChartErrorFallback}>
                <CategorySpendingChart data={categoryData} height={320} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Spending Trend Chart (Full Width) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-bold text-[#333333] dark:text-white mb-6">
              Spending Trend Over Time
            </h3>
            <ErrorBoundary fallback={ChartErrorFallback}>
              <SpendingTrendChart
                data={monthlyData}
                totalBudget={project.totalBudget}
                height={300}
              />
            </ErrorBoundary>
          </div>

          {/* Cost Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[#333333] dark:text-white">
                  Detailed Cost Breakdown
                </h3>
                <div className="flex items-center gap-3">
                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search costs..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 pr-4 h-9 text-sm w-[200px]"
                    />
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      search
                    </span>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedCosts.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-4">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedCosts.size} cost(s) selected
                  </p>
                  <div className="flex gap-2 flex-1 justify-end">
                    <Button size="sm" variant="outline" onClick={handleExportSelected}>
                      Export Selected
                    </Button>
                    <Select
                      onValueChange={handleBulkCategorize}
                      disabled={updateCostMutation.isPending}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue
                          placeholder={
                            updateCostMutation.isPending ? "Updating..." : "Change Category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Delete functionality hidden until backend API is implemented */}
                    {/* <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                      Delete
                    </Button> */}
                    <Button size="sm" variant="ghost" onClick={() => setSelectedCosts(new Set())}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[800px]"
                role="table"
                aria-label="Project costs breakdown"
              >
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedCosts.size === filteredAndSortedCosts.length &&
                          filteredAndSortedCosts.length > 0
                        }
                        onChange={handleSelectAll}
                        aria-label="Select all costs"
                        className="w-4 h-4"
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={() => handleSort("description")}
                    >
                      Description {getSortIcon("description")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={() => handleSort("category")}
                    >
                      Category {getSortIcon("category")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={() => handleSort("contact")}
                    >
                      Vendor {getSortIcon("contact")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={() => handleSort("date")}
                    >
                      Date {getSortIcon("date")}
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={() => handleSort("amount")}
                    >
                      Amount {getSortIcon("amount")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredAndSortedCosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-500 dark:text-slate-400"
                      >
                        {debouncedSearch || categoryFilter !== "all"
                          ? "No costs match your filters"
                          : "No costs recorded yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCosts.map((cost) => {
                      const isEditing = editingCostId === cost.id
                      const isSelected = selectedCosts.has(cost.id)

                      return (
                        <tr
                          key={cost.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectCost(cost.id)}
                              aria-label={`Select cost: ${cost.description}`}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <Input
                                value={editFormData.description}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    description: e.target.value,
                                  })
                                }
                                className="text-sm"
                              />
                            ) : (
                              <div>
                                <div className="text-sm font-semibold text-[#333333] dark:text-white">
                                  {cost.description}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <Select
                                value={editFormData.categoryId}
                                onValueChange={(value) =>
                                  setEditFormData({
                                    ...editFormData,
                                    categoryId: value,
                                  })
                                }
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <CategoryBadge
                                category={cost.category?.displayName || "Uncategorized"}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                            {cost.contact
                              ? `${cost.contact.firstName} ${cost.contact.lastName}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {new Date(cost.date).toLocaleDateString("en-AU", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editFormData.amount / 100}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    amount: Math.round(parseFloat(e.target.value) * 100),
                                  })
                                }
                                className="text-sm w-32 ml-auto"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-[#333333] dark:text-white">
                                {formatCurrency(cost.amount)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {isEditing ? (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={updateCostMutation.isPending}
                                >
                                  {updateCostMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  disabled={updateCostMutation.isPending}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditCost(cost)}
                                className="text-[#137fec] dark:text-[#137fec]/90 hover:underline font-medium"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredAndSortedCosts.length} of {costs.length} costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
