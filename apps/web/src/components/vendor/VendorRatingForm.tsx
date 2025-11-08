"use client"

/**
 * VendorRatingForm Component
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Form for creating and editing vendor ratings
 * Features:
 * - Star rating input (1-5, required)
 * - Review textarea (optional, max 500 chars)
 * - Character counter
 * - Validation with React Hook Form + Zod
 * - Edit mode: pre-populate with existing rating
 * - Create mode: blank form
 * - Optimistic updates
 */

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/trpc/client"
import { StarRating } from "./StarRating"

const ratingFormSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  review: z.string().max(500, "Review cannot exceed 500 characters").optional(),
})

type RatingFormData = z.infer<typeof ratingFormSchema>

interface VendorRatingFormProps {
  contactId: string
  projectId: string
  existingRating?: {
    id: string
    rating: number
    review: string | null
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function VendorRatingForm({
  contactId,
  projectId,
  existingRating,
  onSuccess,
  onCancel,
}: VendorRatingFormProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [charCount, setCharCount] = useState(0)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: existingRating?.rating ?? 0,
      review: existingRating?.review ?? "",
    },
  })

  // Watch review for character counter
  const review = watch("review")

  // Update character count when review changes
  useEffect(() => {
    setCharCount(review?.length ?? 0)
  }, [review])

  const createRating = api.vendor.createVendorRating.useMutation({
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Your vendor rating has been saved successfully.",
      })
      utils.vendor.getVendorMetrics.invalidate({ contactId })
      utils.vendor.getVendorRatings.invalidate({ contactId })
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    },
  })

  const updateRating = api.vendor.updateVendorRating.useMutation({
    onSuccess: () => {
      toast({
        title: "Rating updated",
        description: "Your vendor rating has been updated successfully.",
      })
      utils.vendor.getVendorMetrics.invalidate({ contactId })
      utils.vendor.getVendorRatings.invalidate({ contactId })
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rating. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (data: RatingFormData) => {
    if (existingRating) {
      await updateRating.mutateAsync({
        ratingId: existingRating.id,
        rating: data.rating,
        review: data.review || undefined,
      })
    } else {
      await createRating.mutateAsync({
        contactId,
        projectId,
        rating: data.rating,
        review: data.review || undefined,
      })
    }
  }

  const isPending = createRating.isPending || updateRating.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Star Rating Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Rating <span className="text-red-500">*</span>
        </label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <StarRating
              value={field.value}
              onChange={field.onChange}
              size="lg"
              className="py-1"
            />
          )}
        />
        {errors.rating && (
          <p className="text-sm text-red-500">{errors.rating.message}</p>
        )}
      </div>

      {/* Review Textarea */}
      <div className="space-y-2">
        <label
          htmlFor="review"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Review (Optional)
        </label>
        <Controller
          name="review"
          control={control}
          render={({ field }) => (
            <Textarea
              id="review"
              placeholder="Share your experience with this vendor..."
              className="min-h-[100px] resize-y"
              {...field}
              value={field.value ?? ""}
            />
          )}
        />
        <div className="flex items-center justify-between">
          <div>
            {errors.review && (
              <p className="text-sm text-red-500">{errors.review.message}</p>
            )}
          </div>
          <p
            className={`text-sm ${
              charCount > 500 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {charCount} / 500
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || isSubmitting}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </div>
    </form>
  )
}
