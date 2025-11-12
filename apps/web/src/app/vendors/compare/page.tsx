"use client"

/**
 * Vendor Comparison View Page
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Allows users to compare up to 5 vendors side-by-side with:
 * - Multi-select vendor picker
 * - Comparison table with all metrics
 * - Sortable columns
 * - Filters (category, minimum rating)
 * - Responsive design
 */

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { StarRating } from "@/components/vendor/StarRating"
import { ArrowUpDown, X, GitCompare } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

type SortField = "name" | "rating" | "projects" | "spent" | "frequency" | "lastUsed"
type SortDirection = "asc" | "desc"

export default function VendorComparePage() {
  const router = useRouter()
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [minRatingFilter, setMinRatingFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("rating")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Get all contacts to populate selector
  const { data: contactsData, isLoading: contactsLoading } = api.contacts.list.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
    }
  )

  // Get categories for filter
  const { data: categoriesData } = api.category.list.useQuery(
    { type: "cost" },
    {
      refetchOnWindowFocus: false,
    }
  )

  // Get comparison data
  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    isError,
    refetch,
  } = api.vendor.compareVendors.useQuery(
    {
      contactIds: selectedVendorIds,
      filters: {
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        minRating: minRatingFilter === "all" ? undefined : Number(minRatingFilter),
      },
    },
    {
      enabled: selectedVendorIds.length > 0,
      refetchOnWindowFocus: false,
    }
  )

  // Contacts that have been used as vendors (have costs)
  const availableVendors = useMemo(() => {
    if (!contactsData) return []
    // Transform the data structure - list returns { contact, category, address }
    // In real implementation, we'd filter to only show contacts that have been used as vendors
    // For now, show all contacts
    return contactsData.map((item: any) => item.contact)
  }, [contactsData])

  // Sorted comparison data
  const sortedComparison = useMemo(() => {
    if (!comparisonData) return []

    const sorted = [...comparisonData].sort((a: any, b: any) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case "name":
          aVal = `${a.vendor.firstName} ${a.vendor.lastName}`.toLowerCase()
          bVal = `${b.vendor.firstName} ${b.vendor.lastName}`.toLowerCase()
          break
        case "rating":
          aVal = a.averageRating ?? -1
          bVal = b.averageRating ?? -1
          break
        case "projects":
          aVal = a.totalProjects
          bVal = b.totalProjects
          break
        case "spent":
          aVal = a.totalSpent
          bVal = b.totalSpent
          break
        case "frequency":
          aVal = a.frequency
          bVal = b.frequency
          break
        case "lastUsed":
          aVal = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
          bVal = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
          break
        default:
          return 0
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }, [comparisonData, sortField, sortDirection])

  const handleVendorToggle = (vendorId: string) => {
    if (selectedVendorIds.includes(vendorId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vendorId))
    } else {
      if (selectedVendorIds.length >= 5) {
        // Max 5 vendors
        return
      }
      setSelectedVendorIds([...selectedVendorIds, vendorId])
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
      {sortField === field && (
        <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  )

  return (
    <div className="px-6 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[{ label: "Vendors", href: "/contacts" }, { label: "Compare Vendors" }]}
        />
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare Vendors</h1>
          <p className="mt-1 text-muted-foreground">
            Select up to 5 vendors to compare their performance metrics side-by-side
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/vendors/dashboard")}>
          View Dashboard
        </Button>
      </div>

      {/* Vendor Selector & Filters */}
      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Select Vendors to Compare
            </CardTitle>
            <CardDescription>
              Choose up to 5 vendors ({selectedVendorIds.length}/5 selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contactsLoading && <Spinner />}
              {availableVendors.slice(0, 20).map((contact: any) => (
                <div key={contact.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={contact.id}
                    checked={selectedVendorIds.includes(contact.id)}
                    onCheckedChange={() => handleVendorToggle(contact.id)}
                    disabled={
                      selectedVendorIds.length >= 5 && !selectedVendorIds.includes(contact.id)
                    }
                  />
                  <Label
                    htmlFor={contact.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {contact.firstName} {contact.lastName}
                    {contact.company && (
                      <span className="text-muted-foreground ml-1">({contact.company})</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Vendors Pills */}
      {selectedVendorIds.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedVendorIds.map((vendorId) => {
            const vendor = availableVendors.find((v: any) => v.id === vendorId)
            return (
              <Badge key={vendorId} variant="secondary" className="pl-3 pr-1 py-1">
                {vendor?.firstName} {vendor?.lastName}
                <button
                  onClick={() => handleVendorToggle(vendorId)}
                  className="ml-2 hover:bg-muted rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedVendorIds([])}
            className="h-7"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Filters */}
      {selectedVendorIds.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="w-48">
            <Label className="text-sm mb-2">Category Filter</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categoriesData?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Label className="text-sm mb-2">Minimum Rating</Label>
            <Select value={minRatingFilter} onValueChange={setMinRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="2">2+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {selectedVendorIds.length === 0 && (
        <EmptyState
          title="No vendors selected"
          description="Select vendors above to start comparing their performance metrics"
        />
      )}

      {selectedVendorIds.length > 0 && comparisonLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {selectedVendorIds.length > 0 && isError && (
        <ErrorState
          message="Failed to load comparison data"
          action={<Button onClick={() => refetch()}>Try Again</Button>}
        />
      )}

      {selectedVendorIds.length > 0 && sortedComparison && sortedComparison.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="name">Vendor</SortButton>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="rating">Rating</SortButton>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="projects">Projects</SortButton>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="spent">Total Spent</SortButton>
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="frequency">Frequency</SortButton>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      <SortButton field="lastUsed">Last Used</SortButton>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedComparison.map((item: any) => (
                    <tr
                      key={item.vendor.id}
                      className="border-b hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/contacts/${item.vendor.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {item.vendor.firstName} {item.vendor.lastName}
                          </p>
                          {item.vendor.company && (
                            <p className="text-sm text-muted-foreground">{item.vendor.company}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.averageRating !== null ? (
                          <div>
                            <StarRating value={item.averageRating} readonly size="sm" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.averageRating.toFixed(1)} ({item.ratingCount})
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No ratings</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{item.totalProjects}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-right">{item.frequency.toFixed(1)} / year</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {item.lastUsed
                          ? formatDistanceToNow(new Date(item.lastUsed), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedVendorIds.length > 0 &&
        sortedComparison &&
        sortedComparison.length === 0 &&
        !comparisonLoading && (
          <EmptyState
            title="No vendors match filters"
            description="Try adjusting your filters to see comparison results"
          />
        )}
    </div>
  )
}
