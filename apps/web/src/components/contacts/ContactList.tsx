"use client"

import * as React from "react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { DataTable } from "./data-table"
import { columns, Contact } from "./columns"

export interface ContactListProps {
  /**
   * Optional project ID to filter contacts
   */
  projectId?: string
  /**
   * Callback when "Create Contact" button is clicked
   */
  onCreateClick?: () => void
  /**
   * Callback when "Edit Contact" is clicked for a contact
   */
  onEditClick?: (contactId: string) => void
}

/**
 * ContactList - Component for displaying and filtering contacts
 *
 * Features:
 * - Advanced filtering with faceted filters
 * - Sortable columns
 * - Pagination
 * - Column visibility controls
 * - Row selection
 * - Loading and error states
 * - Empty state with create CTA
 *
 * @param projectId - Optional project ID to filter contacts
 * @param onCreateClick - Callback when "Create Contact" button is clicked
 * @param onEditClick - Callback when "Edit Contact" is clicked for a contact
 */
export function ContactList({
  projectId,
  onCreateClick,
  onEditClick,
}: ContactListProps): JSX.Element {
  // Fetch contacts
  const { data, isLoading, isError, refetch } = api.contacts.list.useQuery({
    projectId: projectId,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        message="Failed to load contacts"
        action={<Button onClick={() => refetch()}>Try Again</Button>}
      />
    )
  }

  const contacts = data || []

  // Transform data for DataTable
  const tableData: Contact[] = contacts.map((item: (typeof data)[number]) => {
    const contact = item.contact
    const category = item.category
    const firstName = contact.firstName || ""
    const lastName = contact.lastName || ""
    const name = `${firstName} ${lastName}`.trim()

    // Get parent category ID for filtering
    const parentCategoryId = category?.parentId || contact.categoryId

    return {
      id: contact.id,
      name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      category: category?.displayName || "Unknown",
      categoryId: contact.categoryId,
      parentCategoryId: parentCategoryId,
    }
  })

  // Empty state
  if (contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts yet"
        description="Get started by creating your first contact."
        action={onCreateClick ? <Button onClick={onCreateClick}>Add Contact</Button> : undefined}
      />
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tableData}
        onCreateClick={onCreateClick}
        onEditClick={onEditClick}
      />
    </div>
  )
}
