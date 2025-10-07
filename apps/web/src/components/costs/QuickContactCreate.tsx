"use client"

import * as React from "react"
import { ContactForm } from "@/components/contacts/ContactForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/trpc/client"

export interface QuickContactCreateProps {
  /**
   * Project ID to link the new contact to
   */
  projectId: string
  /**
   * Whether the modal is open
   */
  isOpen: boolean
  /**
   * Callback to close the modal
   */
  onClose: () => void
  /**
   * Callback fired after successful contact creation
   */
  onSuccess: (contact: { id: string; firstName: string; lastName: string | null }) => void
}

/**
 * QuickContactCreate - Modal for quick contact creation from cost form
 *
 * Features:
 * - Reuses ContactForm component in modal context
 * - Auto-links created contact to the project
 * - Returns created contact to parent component
 * - Maintains cost form state while creating contact
 *
 * Mobile-optimized with full-screen modal on small devices
 */
export function QuickContactCreate({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: QuickContactCreateProps) {
  const utils = api.useUtils()

  // Link contact to project mutation
  const linkContact = api.contacts.linkToProject.useMutation({
    onSuccess: () => {
      // Invalidate project contacts list
      void utils.contacts.listByProject.invalidate({ projectId })
    },
  })

  const handleContactCreated = async (contactId: string) => {
    // Link contact to project
    try {
      await linkContact.mutateAsync({
        projectId,
        contactId,
      })

      // Get the created contact details
      const contact = await utils.contacts.getById.fetch(contactId)

      if (contact) {
        onSuccess({
          id: contact.contact.id,
          firstName: contact.contact.firstName,
          lastName: contact.contact.lastName,
        })
      }
    } catch (error) {
      console.error("Failed to link contact to project:", error)
      // Still call onSuccess with contact ID even if linking fails
      onSuccess({
        id: contactId,
        firstName: "Contact",
        lastName: null,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contractor or vendor. This contact will be linked to your current project.
          </DialogDescription>
        </DialogHeader>

        <ContactForm onSuccess={handleContactCreated} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}
