"use client"

import * as React from "react"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { formatCurrency } from "@/lib/utils/currency"
import { getCategoryById } from "@/server/db/types"
import { ChevronDown, ChevronUp, User, AlertCircle } from "lucide-react"

export interface ContactGroupedCostsProps {
  /**
   * Project ID to display costs for
   */
  projectId: string
}

/**
 * ContactGroupedCosts - Displays costs grouped by contact
 *
 * Features:
 * - Costs organized under contact names
 * - Contact category badge with each group
 * - Total per contact displayed
 * - Sorted by spending (highest first)
 * - Collapsible groups for better mobile UX
 * - Shows orphaned costs (no contact) separately
 *
 * Mobile-optimized with collapsible sections
 */
export function ContactGroupedCosts({ projectId }: ContactGroupedCostsProps) {
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError } = api.costs.getCostsByContact.useQuery({ projectId })

  const toggleGroup = (contactId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) {
        next.delete(contactId)
      } else {
        next.add(contactId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (!data) return
    if (openGroups.size === data.length) {
      setOpenGroups(new Set())
    } else {
      setOpenGroups(
        new Set<string>(
          data.map((group: { contactId: string | null }) => group.contactId ?? "unassigned") // eslint-disable-line @typescript-eslint/no-explicit-any
        )
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message="Failed to load costs by contact" />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No costs found"
        description="No costs have been added to this project yet"
      />
    )
  }

  const allExpanded = openGroups.size === data.length

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse all */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data.length} contact{data.length !== 1 ? "s" : ""} with costs
        </div>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allExpanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Contact groups */}
      <div className="space-y-3">
        {(data as any[]).map(
          // eslint-disable-line @typescript-eslint/no-explicit-any
          (group: {
            contactId: string | null
            contactName: string
            contactCategory: string | null
            costs: Array<{
              id: string
              description: string
              date: Date
              amount: number
              category: { displayName: string } | null
            }>
            total: number
          }) => {
            const contactId = group.contactId ?? "unassigned"
            const isOpen = openGroups.has(contactId)
            const category = group.contactCategory ? getCategoryById(group.contactCategory) : null

            return (
              <Card key={contactId}>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => toggleGroup(contactId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {group.contactId ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {group.contactName}
                          {!group.contactId && (
                            <Badge variant="outline" className="ml-2 text-xs text-orange-600">
                              Unassigned
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          {category && (
                            <Badge variant="secondary" className="text-xs">
                              {category.displayName}
                            </Badge>
                          )}
                          <span>
                            {group.costs.length} cost{group.costs.length !== 1 ? "s" : ""}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-sm font-semibold">
                        {formatCurrency(group.total)}
                      </Badge>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent>
                    <div className="space-y-2">
                      {group.costs.map(
                        (cost: {
                          id: string
                          description: string
                          date: Date
                          amount: number
                          category: { displayName: string } | null
                        }) => (
                          <div
                            key={cost.id}
                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{cost.description}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {cost.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {cost.category.displayName}
                                  </Badge>
                                )}
                                <span>{new Date(cost.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <p className="font-semibold">{formatCurrency(cost.amount)}</p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          }
        )}
      </div>
    </div>
  )
}
