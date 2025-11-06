"use client"

import * as React from "react"
import { api } from "@/lib/trpc/client"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface ContactSelectorProps {
  /**
   * Project ID to filter contacts by
   */
  projectId: string
  /**
   * Current selected contact ID (null for unassigned)
   */
  value: string | null | undefined
  /**
   * Callback when contact selection changes
   */
  onChange: (contactId: string | null) => void
  /**
   * Callback to trigger quick contact creation
   */
  onCreateNew: () => void
  /**
   * Validation error message
   */
  error?: string
  /**
   * Whether to show "Unassigned" option
   */
  allowUnassigned?: boolean
  /**
   * Disable the selector
   */
  disabled?: boolean
}

/**
 * ContactSelector - Searchable dropdown for selecting contacts
 *
 * Features:
 * - Filters contacts by project association
 * - Debounced search functionality
 * - Quick contact creation action
 * - Shows contact category badge
 * - Optional "Unassigned" option for orphaned costs
 *
 * Mobile-optimized with 44px minimum touch targets
 */
export function ContactSelector({
  projectId,
  value,
  onChange,
  onCreateNew,
  error,
  allowUnassigned = true,
  disabled = false,
}: ContactSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [recentContactIds, setRecentContactIds] = React.useState<string[]>([])

  const recentKey = `recent-contacts-${projectId}`

  // Debounce search term (300ms delay)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Dynamic search: only fetch when user types (min 2 characters)
  const shouldSearch = debouncedSearch.length >= 2
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
  } = api.contacts.list.useQuery(
    { search: debouncedSearch },
    {
      enabled: shouldSearch,
    }
  )

  // Fetch recent contacts separately (by IDs)
  const { data: recentContactsData, isLoading: isLoadingRecent } = api.contacts.list.useQuery(
    {},
    {
      enabled: recentContactIds.length > 0 && !shouldSearch,
      select: (data) => {
        // Filter to only recent contact IDs
        return data.filter((row: any) => recentContactIds.includes(row.contact.id)) // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    }
  )

  // Load recent contact IDs from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(recentKey)
      if (stored) {
        setRecentContactIds(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load recent contacts:", error)
    }
  }, [recentKey])

  // Save contact as recently used when selected
  const handleChange = (contactId: string | null) => {
    onChange(contactId)

    // Track recently used contacts (max 5)
    if (contactId && contactId !== "unassigned") {
      const updated = [contactId, ...recentContactIds.filter((id) => id !== contactId)].slice(0, 5)
      setRecentContactIds(updated)
      localStorage.setItem(recentKey, JSON.stringify(updated))
    }
  }

  // Display contacts based on search state
  const displayContacts = shouldSearch ? (searchResults ?? []) : (recentContactsData ?? [])

  // Get recently used contacts (only when not searching)
  const recentContacts = React.useMemo(() => {
    if (shouldSearch) return []
    return (recentContactsData ?? []).slice(0, 5)
  }, [recentContactsData, shouldSearch])

  // Get other search results (excluding recent when showing recent)
  const otherContacts = React.useMemo(() => {
    if (shouldSearch) return searchResults ?? []
    return []
  }, [searchResults, shouldSearch])

  // Fetch selected contact for display if we have a value
  const { data: selectedContactData } = api.contacts.list.useQuery(
    {},
    {
      enabled: !!value && !displayContacts.find((row: any) => row.contact.id === value), // eslint-disable-line @typescript-eslint/no-explicit-any
      select: (data) => data.find((row: any) => row.contact.id === value), // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  )

  const selectedContact =
    displayContacts.find((row: any) => row.contact.id === value) || selectedContactData // eslint-disable-line @typescript-eslint/no-explicit-any

  const isLoading = isSearching || isLoadingRecent || isFetching

  return (
    <div className="space-y-2">
      <Select
        value={value ?? "unassigned"}
        onValueChange={(v) => handleChange(v === "unassigned" ? null : v)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={`min-h-[44px] ${error ? "border-red-500" : ""}`}>
          <SelectValue>
            {isLoading ? (
              "Loading contacts..."
            ) : value && selectedContact ? (
              <div className="flex items-center gap-2">
                <span>
                  {selectedContact.contact.firstName} {selectedContact.contact.lastName}
                </span>
                {selectedContact.category && (
                  <Badge variant="outline" className="text-xs">
                    {selectedContact.category.displayName}
                  </Badge>
                )}
              </div>
            ) : (
              "No contact"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Search input */}
          <div className="p-2">
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // Prevent Select from intercepting keyboard events
                e.stopPropagation()
              }}
            />
          </div>

          {/* Create new contact button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-2 py-1.5 text-sm font-normal"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateNew()
            }}
          >
            <Plus className="h-4 w-4" />
            Create New Contact
          </Button>

          {/* Unassigned option */}
          {allowUnassigned && (
            <SelectGroup>
              <SelectItem value="unassigned">
                <span className="text-muted-foreground">No contact (Unassigned)</span>
              </SelectItem>
            </SelectGroup>
          )}

          {/* Loading state during search */}
          {isLoading && searchTerm.length >= 2 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">Searching...</div>
          )}

          {/* Recent contacts (shown when not searching) */}
          {!shouldSearch && recentContacts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Recently Used</SelectLabel>
              {recentContacts.map(
                (
                  row: any // eslint-disable-line @typescript-eslint/no-explicit-any
                ) => (
                  <SelectItem key={row.contact.id} value={row.contact.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {row.contact.firstName} {row.contact.lastName}
                      </span>
                      {row.contact.company && (
                        <span className="text-muted-foreground text-xs">
                          ({row.contact.company})
                        </span>
                      )}
                      {row.category && (
                        <Badge variant="outline" className="text-xs">
                          {row.category.displayName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              )}
            </SelectGroup>
          )}

          {/* Search results */}
          {shouldSearch && otherContacts.length > 0 && !isLoading ? (
            <SelectGroup>
              <SelectLabel>Search Results</SelectLabel>
              {otherContacts.map(
                (
                  row: any // eslint-disable-line @typescript-eslint/no-explicit-any
                ) => (
                  <SelectItem key={row.contact.id} value={row.contact.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {row.contact.firstName} {row.contact.lastName}
                      </span>
                      {row.contact.company && (
                        <span className="text-muted-foreground text-xs">
                          ({row.contact.company})
                        </span>
                      )}
                      {row.category && (
                        <Badge variant="outline" className="text-xs">
                          {row.category.displayName}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              )}
            </SelectGroup>
          ) : shouldSearch && !isLoading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No contacts found matching "{searchTerm}"
            </div>
          ) : !shouldSearch && recentContacts.length === 0 && !isLoading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Type to search contacts (minimum 2 characters)
            </div>
          ) : null}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
