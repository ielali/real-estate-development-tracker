"use client"

import * as React from "react"
import { useState } from "react"
import { ContactList } from "@/components/contacts/ContactList"
import { ContactForm } from "@/components/contacts/ContactForm"
import { Navbar } from "@/components/layout/Navbar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Contacts page - Main page for contact management
 *
 * Features:
 * - Contact list with search and filtering
 * - Create new contacts via modal dialog
 * - Mobile-responsive layout
 * - Breadcrumb navigation
 */
export default function ContactsPage(): JSX.Element {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
  }

  const handleCreateCancel = () => {
    setIsCreateDialogOpen(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your vendors, contractors, and project contacts
          </p>
        </div>

        {/* Contact list */}
        <ContactList onCreateClick={handleCreateClick} />

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
      </div>
    </main>
  )
}
