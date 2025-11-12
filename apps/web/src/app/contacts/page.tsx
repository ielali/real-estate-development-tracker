"use client"

import * as React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ContactList } from "@/components/contacts/ContactList"
import { ContactForm } from "@/components/contacts/ContactForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/trpc/client"
import { Spinner } from "@/components/ui/spinner"
import { Breadcrumb } from "@/components/ui/breadcrumb"

/**
 * Deep linking handler component - handles ?action=add URL parameter
 * Must be in a separate component to be wrapped with Suspense
 */
function DeepLinkHandler({ onOpenCreate }: { onOpenCreate: () => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get("action") === "add") {
      onOpenCreate()
      // Clean up URL by removing the parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams, onOpenCreate])

  return null
}

/**
 * Contacts page - Main page for contact management
 *
 * Features:
 * - Contact list with search and filtering
 * - Create new contacts via modal dialog
 * - Edit contacts via modal dialog
 * - Mobile-responsive layout
 * - Breadcrumb navigation
 * - Deep linking support via ?action=add URL parameter
 */
export default function ContactsPage(): JSX.Element {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editContactId, setEditContactId] = useState<string | null>(null)

  // Fetch contact details for editing
  const { data: editContact, isLoading: isLoadingEditContact } = api.contacts.getById.useQuery(
    editContactId!,
    {
      enabled: !!editContactId,
    }
  )

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
  }

  const handleCreateCancel = () => {
    setIsCreateDialogOpen(false)
  }

  const handleEditClick = (contactId: string) => {
    setEditContactId(contactId)
  }

  const handleEditSuccess = () => {
    setEditContactId(null)
  }

  const handleEditCancel = () => {
    setEditContactId(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Deep linking handler - wrapped in Suspense for Next.js static generation */}
      <Suspense fallback={null}>
        <DeepLinkHandler onOpenCreate={handleCreateClick} />
      </Suspense>

      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Contacts" }]} />
        </div>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your vendors, contractors, and project contacts
          </p>
        </div>

        {/* Contact list */}
        <ContactList onCreateClick={handleCreateClick} onEditClick={handleEditClick} />

        {/* Create contact dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Create a new contact for your projects. All fields except first name and category
                are optional.
              </DialogDescription>
            </DialogHeader>
            <ContactForm onSuccess={handleCreateSuccess} onCancel={handleCreateCancel} />
          </DialogContent>
        </Dialog>

        {/* Edit contact dialog */}
        <Dialog open={!!editContactId} onOpenChange={(open) => !open && setEditContactId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information. All fields except first name and category are optional.
              </DialogDescription>
            </DialogHeader>
            {isLoadingEditContact ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              editContact && (
                <ContactForm
                  key={editContact.contact.id}
                  contactId={editContact.contact.id}
                  defaultValues={{
                    firstName: editContact.contact.firstName,
                    lastName: editContact.contact.lastName || undefined,
                    company: editContact.contact.company || undefined,
                    email: editContact.contact.email || undefined,
                    phone: editContact.contact.phone || undefined,
                    mobile: editContact.contact.mobile || undefined,
                    website: editContact.contact.website || undefined,
                    categoryId: editContact.contact.categoryId,
                    notes: editContact.contact.notes || undefined,
                    addressId: editContact.contact.addressId,
                  }}
                  onSuccess={handleEditSuccess}
                  onCancel={handleEditCancel}
                />
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
