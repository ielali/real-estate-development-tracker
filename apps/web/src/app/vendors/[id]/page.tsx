"use client"

/**
 * Vendor Detail Page
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Displays comprehensive vendor information including:
 * - Vendor contact details
 * - Performance metrics (projects, spend, frequency)
 * - Category specializations
 * - Ratings and reviews
 * - Cost history
 * - Project associations
 */

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Spinner } from "@/components/ui/spinner"
import { ContactForm } from "@/components/contacts/ContactForm"
import { ContactSpending } from "@/components/contacts/ContactSpending"
import { VendorMetricsCard } from "@/components/vendor/VendorMetricsCard"
import { VendorRatingsSection } from "@/components/vendor/VendorRatingsSection"
import { RelatedDocuments } from "@/components/documents/RelatedDocuments"
import { DocumentLinkSelector } from "@/components/documents/DocumentLinkSelector"
import { useSession } from "@/lib/auth-client"
import { getCategoryById } from "@/server/db/types"
import { toast } from "sonner"
import {
  Mail,
  Phone,
  Globe,
  Building2,
  FileText,
  ArrowLeft,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Link as LinkIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDistanceToNow } from "date-fns"

interface VendorDetailPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Vendor Detail Page - Displays comprehensive vendor information
 *
 * This page provides a focused view of a vendor with all relevant
 * performance metrics, ratings, and history in one place.
 */
export default function VendorDetailPage({ params }: VendorDetailPageProps): JSX.Element {
  const router = useRouter()
  const { data: session } = useSession()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Unwrap params Promise
  React.useEffect(() => {
    params.then((p) => setVendorId(p.id))
  }, [params])

  // Fetch vendor contact details
  const {
    data: contactData,
    isLoading: contactLoading,
    isError: contactError,
    refetch: refetchContact,
  } = api.contacts.getById.useQuery(vendorId!, {
    enabled: !!vendorId,
  })

  // Fetch vendor metrics
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isError: metricsError,
  } = api.vendor.getVendorMetrics.useQuery(
    { contactId: vendorId! },
    {
      enabled: !!vendorId,
      retry: false, // Don't retry if vendor has no associated costs
    }
  )

  // Fetch vendor ratings
  const { data: ratingsData, isLoading: ratingsLoading } = api.vendor.getVendorRatings.useQuery(
    { contactId: vendorId! },
    {
      enabled: !!vendorId,
    }
  )

  // Delete contact mutation
  const deleteMutation = api.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully")
      router.push("/contacts")
    },
    onError: () => {
      toast.error("Failed to delete contact. Please try again.")
    },
  })

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    void refetchContact()
  }

  const handleDelete = () => {
    if (vendorId) {
      deleteMutation.mutate(vendorId)
    }
  }

  const handleDocumentsUpdate = () => {
    void refetchContact()
  }

  // Loading state
  if (!vendorId || contactLoading || metricsLoading || ratingsLoading) {
    return (
      <div className="px-6 py-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      </div>
    )
  }

  // Error state
  if (contactError || !contactData) {
    return (
      <div className="px-6 py-6 max-w-7xl">
        <ErrorState
          message="Failed to load vendor details"
          action={<Button onClick={() => refetchContact()}>Try Again</Button>}
        />
      </div>
    )
  }

  // Check if contact is actually a vendor (has associated costs)
  if (metricsError || !metricsData) {
    return (
      <div className="px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <EmptyState
          title="Not a vendor"
          description={`${contactData.contact.firstName} ${contactData.contact.lastName} has not been used as a vendor yet. They need to have associated costs in projects to appear as a vendor.`}
          action={
            <Button onClick={() => router.push(`/contacts/${vendorId}`)}>
              View Contact Details
            </Button>
          }
        />
      </div>
    )
  }

  const contact = contactData.contact
  const category = contactData.category
  const parentCategory = category?.parentId ? getCategoryById(category.parentId) : null
  const metrics = metricsData
  const ratings = ratingsData || []

  // Calculate total spending across all projects
  const totalSpending = contactData.costs.reduce(
    (sum: number, row: any) => sum + (row.cost.amount || 0),
    0
  )

  return (
    <div className="px-6 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Vendors", href: "/vendors/dashboard" },
            { label: `${contact.firstName} ${contact.lastName}` },
          ]}
        />
      </div>

      {/* Header with vendor info and actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.company && (
            <p className="mt-1 text-lg text-muted-foreground">{contact.company}</p>
          )}

          {/* Quick metrics badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {metrics.averageRating && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                {metrics.averageRating.toFixed(1)} ({metrics.ratingCount} rating
                {metrics.ratingCount !== 1 ? "s" : ""})
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {metrics.totalProjects} project{metrics.totalProjects !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(metrics.totalSpent)}
            </Badge>
            {metrics.frequency > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {metrics.frequency.toFixed(1)} projects/year
              </Badge>
            )}
            {metrics.lastUsed && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last used {formatDistanceToNow(new Date(metrics.lastUsed), { addSuffix: true })}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Contact
          </Button>
          <Button onClick={() => router.push(`/vendors/compare?vendors=${vendorId}` as never)}>
            Compare
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">
            Ratings {ratings.length > 0 && `(${ratings.length})`}
          </TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category */}
                {category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <div className="mt-1">
                      <Badge variant="secondary">{category.displayName}</Badge>
                      {parentCategory && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parentCategory.displayName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${contact.mobile}`} className="text-sm hover:underline">
                      {contact.mobile} (Mobile)
                    </a>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contact.company}</span>
                  </div>
                )}
                {contact.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{contact.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <VendorMetricsCard contactId={vendorId} hideHeader />
              </CardContent>
            </Card>

            {/* Category Specializations */}
            {metrics.categorySpecialization && metrics.categorySpecialization.length > 0 && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Category Specializations</CardTitle>
                  <CardDescription>Top categories by spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {metrics.categorySpecialization.map((cat: any, index: number) => (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <Badge variant={index === 0 ? "default" : "secondary"} className="mb-1">
                            #{index + 1}
                          </Badge>
                          <p className="font-medium">{cat.categoryName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(cat.totalSpent)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <VendorRatingsSection
            contactId={vendorId}
            currentUserId={session?.user?.id}
            showHeader={false}
          />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related Projects</CardTitle>
              <CardDescription>
                All projects where {contact.firstName} {contact.lastName} has been used as a vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactData.projects.length === 0 ? (
                <EmptyState
                  title="No projects"
                  description="This vendor is not associated with any projects yet"
                />
              ) : (
                <div className="space-y-3">
                  {contactData.projects.map((row: any) => {
                    const projectCosts = contactData.costs.filter(
                      (c: any) => c.project.id === row.project.id
                    )
                    const projectTotal = projectCosts.reduce(
                      (sum: number, c: any) => sum + c.cost.amount,
                      0
                    )

                    return (
                      <div
                        key={row.projectContact.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
                      >
                        <div>
                          <p className="font-medium">{row.project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.project.projectType} • {projectCosts.length} cost
                            {projectCosts.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            Total: {formatCurrency(projectTotal)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/projects/${row.project.id}`)}
                        >
                          View Project
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Documents */}
          {contactData.projects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Related Documents</CardTitle>
                    <CardDescription>Documents linked to this vendor</CardDescription>
                  </div>
                  <DocumentLinkSelector
                    entityType="contact"
                    entityId={vendorId}
                    projectId={contactData.projects[0].project.id}
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
                  entityId={vendorId}
                  onUpdate={handleDocumentsUpdate}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <ContactSpending contactId={vendorId} showHeader={false} />

          <Card>
            <CardHeader>
              <CardTitle>Cost History</CardTitle>
              <CardDescription>
                All expenses associated with this vendor
                <span className="ml-2 font-semibold text-foreground">
                  Total: {formatCurrency(totalSpending)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactData.costs.length === 0 ? (
                <EmptyState
                  title="No costs"
                  description="No expenses have been linked to this vendor yet"
                />
              ) : (
                <div className="space-y-3">
                  {contactData.costs.map((row: any) => (
                    <div
                      key={row.cost.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{row.cost.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.project.name} • {row.category?.displayName || "Uncategorized"}
                        </p>
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
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>
          <ContactForm
            contactId={vendorId}
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
              This will delete the vendor &quot;{contact.firstName} {contact.lastName}&quot;.
              {contactData.costs.length > 0 || contactData.projects.length > 0 ? (
                <>
                  {" "}
                  This vendor has {contactData.costs.length} linked cost
                  {contactData.costs.length !== 1 ? "s" : ""} and {contactData.projects.length}{" "}
                  project association{contactData.projects.length !== 1 ? "s" : ""}. These
                  relationships will be preserved for historical data.
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
