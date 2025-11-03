"use client"

/**
 * NewCommentForm Component
 * Story 8.3: Threaded Comments on Entities
 *
 * Form for creating new comments and replies
 * Features:
 * - Character counter (2000 max)
 * - Validation with React Hook Form + Zod
 * - Submit and Cancel buttons
 * - Auto-clear on success
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"

const commentFormSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
})

type CommentFormData = z.infer<typeof commentFormSchema>

interface NewCommentFormProps {
  entityType: "cost" | "document" | "event"
  entityId: string
  projectId: string
  parentCommentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function NewCommentForm({
  entityType,
  entityId,
  projectId,
  parentCommentId,
  onSuccess,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
}: NewCommentFormProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [charCount, setCharCount] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  })

  // Watch content for character counter
  const content = watch("content")

  // Update character count when content changes
  useState(() => {
    setCharCount(content?.length ?? 0)
  })

  const createComment = api.comments.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      void utils.comments.list.invalidate({
        entityType,
        entityId,
      })
      void utils.comments.getCount.invalidate({
        entityType,
        entityId,
      })

      // Reset form
      reset()
      setCharCount(0)

      // Call success callback
      onSuccess?.()

      toast({
        title: "Comment posted",
        description: "Your comment has been successfully posted.",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: CommentFormData) => {
    createComment.mutate({
      entityType,
      entityId,
      projectId,
      content: data.content,
      parentCommentId,
    })
  }

  const isSubmitting = createComment.isPending
  const isDisabled = isSubmitting || !content || content.length === 0 || content.length > 2000

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        <Textarea
          {...register("content", {
            onChange: (e) => setCharCount(e.target.value.length),
          })}
          placeholder={placeholder}
          rows={3}
          disabled={isSubmitting}
          autoFocus={autoFocus}
          className="resize-none"
        />

        <div className="flex items-center justify-between text-sm">
          <div>
            {errors.content && <p className="text-destructive">{errors.content.message}</p>}
          </div>

          <p
            className={`text-muted-foreground ${
              charCount > 2000 ? "text-destructive font-medium" : ""
            }`}
          >
            {charCount} / 2000 characters
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isDisabled} size="sm">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {parentCommentId ? "Reply" : "Comment"}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
