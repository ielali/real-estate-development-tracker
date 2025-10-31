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
  const [recentContactIds, setRecentContactIds] = React.useState<string[]>([])

  const recentKey = `recent-contacts-${projectId}`

  // Get all contacts (not just project-linked) for broader selection
  const { data: projectContacts, isLoading } = api.contacts.list.useQuery({})

  // Load recent contacts from localStorage
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

  // Filter contacts by search term
  const filteredContacts = React.useMemo(() => {
    const contacts = projectContacts ?? []
    if (!searchTerm) return contacts

    const term = searchTerm.toLowerCase()
    return contacts.filter((contact: any) => {
      const fullName = `${contact.firstName} ${contact.lastName ?? ""}`.toLowerCase()
      const company = contact.company?.toLowerCase() ?? ""
      return fullName.includes(term) || company.includes(term)
    })
  }, [projectContacts, searchTerm])

  // Get recently used contacts that are in the filtered list
  const recentContacts = React.useMemo(() => {
    if (searchTerm) return [] // Don't show recent when searching
    const contacts = projectContacts ?? []
    return recentContactIds
      .map((id) => contacts.find((c: any) => c.id === id))
      .filter(Boolean)
      .slice(0, 5) // Max 5 recent contacts
  }, [recentContactIds, projectContacts, searchTerm])

  // Get other contacts (excluding recent)
  const otherContacts = React.useMemo(() => {
    if (recentContacts.length === 0) return filteredContacts
    const recentIds = new Set(recentContacts.map((c: any) => c.id))
    return filteredContacts.filter((contact: any) => !recentIds.has(contact.id))
  }, [filteredContacts, recentContacts])

  // Get selected contact for display
  const selectedContact = projectContacts?.find((c: any) => c.id === value)

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
                  {selectedContact.firstName} {selectedContact.lastName}
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

          {/* Recent contacts */}
          {recentContacts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Recently Used</SelectLabel>
              {recentContacts.map((contact: any) => (
                <SelectItem key={contact.id} value={contact.id}>
                  <div className="flex items-center gap-2">
                    <span>
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.company && (
                      <span className="text-muted-foreground text-xs">({contact.company})</span>
                    )}
                    {contact.category && (
                      <Badge variant="outline" className="text-xs">
                        {contact.category.displayName}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Other contacts */}
          {otherContacts.length > 0 ? (
            <SelectGroup>
              <SelectLabel>{recentContacts.length > 0 ? "Other Contacts" : "Contacts"}</SelectLabel>
              {otherContacts.map((contact: any) => (
                <SelectItem key={contact.id} value={contact.id}>
                  <div className="flex items-center gap-2">
                    <span>
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.company && (
                      <span className="text-muted-foreground text-xs">({contact.company})</span>
                    )}
                    {contact.category && (
                      <Badge variant="outline" className="text-xs">
                        {contact.category.displayName}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ) : searchTerm ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No contacts found matching "{searchTerm}"
            </div>
          ) : recentContacts.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No contacts linked to this project yet
            </div>
          ) : null}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
