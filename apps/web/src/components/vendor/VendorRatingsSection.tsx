"use client"

/**
 * VendorRatingsSection Component
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Complete ratings section for vendor profile page
 * Features:
 * - "Add Rating" button (if user has projects with this vendor)
 * - Vendor Rating Form (in dialog)
 * - Vendor Ratings List
 * - Empty state when no ratings
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { VendorRatingForm } from "./VendorRatingForm"
import { VendorRatingsList } from "./VendorRatingsList"

interface VendorRatingsSectionProps {
  contactId: string
  currentUserId?: string
  showHeader?: boolean
}

export function VendorRatingsSection({
  contactId,
  currentUserId,
  showHeader = true,
}: VendorRatingsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  // Get the contact's project associations to determine which projects user can rate on
  const { data: contactData } = api.contacts.getById.useQuery(contactId, {
    refetchOnWindowFocus: false,
  })

  // Get existing ratings to check if user already rated on selected project
  const { data: ratings } = api.vendor.getVendorRatings.useQuery(
    { contactId },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  const availableProjects = contactData?.projects || []
  const hasProjects = availableProjects.length > 0

  // Check if user already has a rating on the selected project
  const existingRating = ratings?.find(
    (r: any) => r.userId === currentUserId && r.projectId === selectedProjectId
  )

  const handleOpenDialog = () => {
    // Auto-select first project if only one available
    if (availableProjects.length === 1) {
      setSelectedProjectId(availableProjects[0].project.id)
    }
    setIsAddDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsAddDialogOpen(false)
    setSelectedProjectId("")
  }

  return (
    <>
      {showHeader ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vendor Ratings</CardTitle>
                <CardDescription>Ratings and reviews from past projects</CardDescription>
              </div>
              {hasProjects && (
                <Button onClick={handleOpenDialog} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rating
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <VendorRatingsList contactId={contactId} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Vendor Ratings</h3>
              <p className="text-sm text-muted-foreground">Ratings and reviews from past projects</p>
            </div>
            {hasProjects && (
              <Button onClick={handleOpenDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Rating
              </Button>
            )}
          </div>
          <VendorRatingsList contactId={contactId} currentUserId={currentUserId} />
        </>
      )}

      {/* Add Rating Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {existingRating ? "Update Rating" : "Rate This Vendor"}
            </DialogTitle>
            <DialogDescription>
              {!existingRating && availableProjects.length > 1
                ? "Select a project to rate this vendor"
                : "Share your experience working with this vendor"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Selector (if multiple projects) */}
            {!existingRating && availableProjects.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project <span className="text-red-500">*</span>
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((proj: any) => (
                      <SelectItem key={proj.project.id} value={proj.project.id}>
                        {proj.project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rating Form */}
            {(selectedProjectId || availableProjects.length === 1) && (
              <VendorRatingForm
                contactId={contactId}
                projectId={selectedProjectId || availableProjects[0].project.id}
                existingRating={existingRating}
                onSuccess={handleSuccess}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
