"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ContactForm } from "@/components/contacts/ContactForm"
import { ContactSpending } from "@/components/contacts/ContactSpending"
import { RelatedDocuments } from "@/components/documents/RelatedDocuments"
import { DocumentLinkSelector } from "@/components/documents/DocumentLinkSelector"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { getCategoryById } from "@/server/db/types"
import {
  Mail,
  Phone,
  Globe,
  Building2,
  FileText,
  Pencil,
  Trash2,
  ArrowLeft,
  Link as LinkIcon,
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/currency"

interface ContactDetailPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Contact Detail Page - Displays full contact information
 *
 * Features:
 * - Contact information display
 * - Related projects list
 * - Related costs with spending summary
 * - Edit and delete actions
 * - Mobile-responsive layout
 */
export default function ContactDetailPage({ params }: ContactDetailPageProps): JSX.Element {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)

  // Unwrap params Promise
  React.useEffect(() => {
    params.then((p) => setContactId(p.id))
  }, [params])

  const { data, isLoading, isError, refetch } = api.contacts.getById.useQuery(contactId!, {
    enabled: !!contactId,
  })

  const deleteMutation = api.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully")
      router.push("/contacts" as never)
    },
    onError: () => {
      toast.error("Failed to delete contact. Please try again.")
    },
  })

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    void refetch()
  }

  const handleDelete = () => {
    if (contactId) {
      deleteMutation.mutate(contactId)
    }
  }

  const handleDocumentsUpdate = () => {
    void refetch()
  }

  // Loading state (including params loading)
  if (!contactId || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ErrorState
          message="Failed to load contact details"
          action={<Button onClick={() => refetch()}>Try Again</Button>}
        />
      </div>
    )
  }

  const contact = data.contact
  const category = data.category
  const parentCategory = category?.parentId ? getCategoryById(category.parentId) : null

  // Calculate total spending
  const totalSpending = data.costs.reduce(
    (sum: number, row: any) => sum + (row.cost.amount || 0),
    0
  )

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header with back button and actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contacts" as never)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.company && <p className="mt-1 text-muted-foreground">{contact.company}</p>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Contact information */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact details card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <div className="mt-1">
                  <Badge variant="secondary">{category?.displayName}</Badge>
                  {parentCategory && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {parentCategory.displayName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              {contact.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-1 flex items-center gap-2 text-sm hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </a>
                </div>
              )}

              {/* Phone */}
              {contact.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="mt-1 flex items-center gap-2 text-sm hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                </div>
              )}

              {/* Mobile */}
              {contact.mobile && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                  <a
                    href={`tel:${contact.mobile}`}
                    className="mt-1 flex items-center gap-2 text-sm hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.mobile}
                  </a>
                </div>
              )}

              {/* Website */}
              {contact.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 text-sm hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {contact.website}
                  </a>
                </div>
              )}

              {/* Company */}
              {contact.company && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    {contact.company}
                  </p>
                </div>
              )}

              {/* Notes */}
              {contact.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1 flex items-start gap-2 text-sm">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-pre-wrap">{contact.notes}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Spending, Projects and costs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Spending Summary */}
          <ContactSpending contactId={contactId} />

          {/* Related Documents */}
          {data.projects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Related Documents</CardTitle>
                    <CardDescription>Documents linked to this contact</CardDescription>
                  </div>
                  <DocumentLinkSelector
                    entityType="contact"
                    entityId={contactId}
                    projectId={data.projects[0].project.id}
                    onUpdate={handleDocumentsUpdate}
                  >
                    <Button variant="outline" size="sm">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Link Documents
                    </Button>
                  </DocumentLinkSelector>
                </div>
              </CardHeader>
              <CardContent>
                <RelatedDocuments
                  entityType="contact"
                  entityId={contactId}
                  onUpdate={handleDocumentsUpdate}
                />
              </CardContent>
            </Card>
          )}

          {/* Related projects */}
          <Card>
            <CardHeader>
              <CardTitle>Related Projects</CardTitle>
              <CardDescription>Projects this contact is associated with</CardDescription>
            </CardHeader>
            <CardContent>
              {data.projects.length === 0 ? (
                <EmptyState
                  title="No projects"
                  description="This contact is not associated with any projects yet"
                />
              ) : (
                <div className="space-y-3">
                  {data.projects.map((row: any) => (
                    <div
                      key={row.projectContact.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{row.project.name}</p>
                        <p className="text-sm text-muted-foreground">{row.project.projectType}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/projects/${row.project.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related costs */}
          <Card>
            <CardHeader>
              <CardTitle>Related Costs</CardTitle>
              <CardDescription>
                Expenses associated with this contact
                {totalSpending > 0 && (
                  <span className="ml-2 font-semibold text-foreground">
                    Total: {formatCurrency(totalSpending)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.costs.length === 0 ? (
                <EmptyState
                  title="No costs"
                  description="No expenses have been linked to this contact yet"
                />
              ) : (
                <div className="space-y-3">
                  {data.costs.map((row: any) => (
                    <div
                      key={row.cost.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{row.cost.description}</p>
                        <p className="text-sm text-muted-foreground">{row.project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(row.cost.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(row.cost.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>
          <ContactForm
            contactId={contactId}
            defaultValues={{
              firstName: contact.firstName,
              lastName: contact.lastName,
              company: contact.company,
              email: contact.email,
              phone: contact.phone,
              mobile: contact.mobile,
              website: contact.website || undefined,
              categoryId: contact.categoryId,
              notes: contact.notes,
              addressId: contact.addressId,
            }}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the contact &quot;{contact.firstName} {contact.lastName}&quot;.
              {data.costs.length > 0 || data.projects.length > 0 ? (
                <>
                  {" "}
                  This contact has {data.costs.length} linked cost
                  {data.costs.length !== 1 ? "s" : ""} and {data.projects.length} project
                  association{data.projects.length !== 1 ? "s" : ""}. These relationships will be
                  preserved for historical data.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
