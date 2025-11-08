"use client"

/**
 * VendorRatingsList Component
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Displays all ratings for a vendor
 * Features:
 * - Star rating visualization
 * - Review text
 * - Reviewer name (if available)
 * - Project name
 * - Date created (relative time)
 * - Highlight user's own rating
 * - Edit button on user's own rating
 * - Empty state
 * - Loading state
 */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, MessageSquare } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { StarRating } from "./StarRating"
import { VendorRatingForm } from "./VendorRatingForm"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface VendorRatingsListProps {
  contactId: string
  currentUserId?: string
}

export function VendorRatingsList({ contactId, currentUserId }: VendorRatingsListProps) {
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null)

  const { data: ratings, isLoading } = api.vendor.getVendorRatings.useQuery(
    { contactId },
    {
      refetchOnWindowFocus: false,
    }
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!ratings || ratings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900">No ratings yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to rate this vendor!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating: {
        id: string
        userId: string
        contactId: string
        projectId: string
        projectName: string
        rating: number
        review: string | null
        createdAt: Date
        updatedAt: Date
      }) => {
        const isOwnRating = currentUserId && rating.userId === currentUserId
        const isEditing = editingRatingId === rating.id

        return (
          <Card
            key={rating.id}
            className={isOwnRating ? "border-blue-200 bg-blue-50/50" : ""}
          >
            <CardContent className="pt-6">
              {isEditing ? (
                <VendorRatingForm
                  contactId={contactId}
                  projectId={rating.projectId}
                  existingRating={{
                    id: rating.id,
                    rating: rating.rating,
                    review: rating.review,
                  }}
                  onSuccess={() => setEditingRatingId(null)}
                  onCancel={() => setEditingRatingId(null)}
                />
              ) : (
                <div className="space-y-3">
                  {/* Header with rating and edit button */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <StarRating value={rating.rating} readonly size="sm" />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">{rating.projectName}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(rating.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {isOwnRating && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Your rating</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isOwnRating && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRatingId(rating.id)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Review text */}
                  {rating.review && (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {rating.review}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
