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

  // Get contacts associated with this project
  const { data: projectContacts, isLoading } = api.contacts.listByProject.useQuery({ projectId })

  // Filter contacts by search term
  const filteredContacts = React.useMemo(() => {
    const contacts = projectContacts ?? []
    if (!searchTerm) return contacts

    const term = searchTerm.toLowerCase()
    return contacts.filter((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName ?? ""}`.toLowerCase()
      const company = contact.company?.toLowerCase() ?? ""
      return fullName.includes(term) || company.includes(term)
    })
  }, [projectContacts, searchTerm])

  // Get selected contact for display
  const selectedContact = projectContacts?.find((c) => c.id === value)

  return (
    <div className="space-y-2">
      <Select
        value={value ?? "unassigned"}
        onValueChange={(v) => onChange(v === "unassigned" ? null : v)}
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

          {/* Contact list */}
          {filteredContacts.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Contacts</SelectLabel>
              {filteredContacts.map((contact) => (
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
          ) : (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No contacts linked to this project yet
            </div>
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
