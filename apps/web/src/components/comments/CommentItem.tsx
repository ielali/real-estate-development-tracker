"use client"

/**
 * CommentItem Component
 * Story 8.3: Threaded Comments on Entities
 *
 * Displays a single comment with:
 * - User avatar, name, timestamp
 * - Markdown-rendered content with XSS protection
 * - Edit/Delete buttons for own comments
 * - Reply button (only for top-level comments)
 * - "Edited" indicator
 * - Soft delete placeholder
 */

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import DOMPurify from "dompurify"
import { MoreVertical, Pencil, Trash2, MessageSquare, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from "@/hooks/use-toast"
import { api } from "@/trpc/react"
import { NewCommentForm } from "./NewCommentForm"

const editFormSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
})

type EditFormData = z.infer<typeof editFormSchema>

interface CommentItemProps {
  comment: {
    id: string
    content: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    parentCommentId: string | null
    userId: string
    user: {
      id: string
      name: string
      email: string
      image: string | null
    }
  }
  entityType: "cost" | "document" | "event"
  entityId: string
  projectId: string
  currentUserId: string
  projectOwnerId: string
  isReply?: boolean
}

export function CommentItem({
  comment,
  entityType,
  entityId,
  projectId,
  currentUserId,
  projectOwnerId,
  isReply = false,
}: CommentItemProps) {
  const { toast } = useToast()
  const utils = api.useUtils()
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      content: comment.content,
    },
  })

  const content = watch("content")

  useEffect(() => {
    setCharCount(content?.length ?? 0)
  }, [content])

  const updateComment = api.comments.update.useMutation({
    onSuccess: () => {
      void utils.comments.list.invalidate({ entityType, entityId })
      setIsEditing(false)
      toast({
        title: "Comment updated",
        description: "Your comment has been successfully updated.",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteComment = api.comments.delete.useMutation({
    onSuccess: () => {
      void utils.comments.list.invalidate({ entityType, entityId })
      void utils.comments.getCount.invalidate({ entityType, entityId })
      toast({
        title: "Comment deleted",
        description: "The comment has been successfully deleted.",
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onEdit = (data: EditFormData) => {
    updateComment.mutate({
      commentId: comment.id,
      content: data.content,
    })
  }

  const onDelete = () => {
    deleteComment.mutate({ commentId: comment.id })
    setShowDeleteDialog(false)
  }

  const onCancelEdit = () => {
    reset({ content: comment.content })
    setIsEditing(false)
  }

  // Check if user owns the comment
  const isOwner = comment.userId === currentUserId
  const canDelete = isOwner || projectOwnerId === currentUserId

  // Check if edited (more than 1 minute after creation)
  const isEdited = comment.updatedAt.getTime() - comment.createdAt.getTime() > 60 * 1000

  // Sanitize content for XSS protection
  const sanitizedContent = DOMPurify.sanitize(comment.content)

  // Get user initials for avatar fallback
  const userInitials = comment.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // If comment is deleted, show placeholder
  if (comment.deletedAt) {
    return (
      <div className={`flex gap-3 ${isReply ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground italic">[Comment deleted]</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isReply ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <Avatar className="h-8 w-8 mt-1">
        {comment.user.image && <AvatarImage src={comment.user.image} alt={comment.user.name} />}
        <AvatarFallback>{userInitials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{comment.user.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
              {isEdited && <span className="text-xs text-muted-foreground italic">(edited)</span>}
            </div>
          </div>

          {(isOwner || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onEdit)} className="space-y-2">
            <Textarea
              {...register("content", {
                onChange: (e) => setCharCount(e.target.value.length),
              })}
              rows={3}
              disabled={updateComment.isPending}
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
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={updateComment.isPending || charCount === 0 || charCount > 2000}
              >
                {updateComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                disabled={updateComment.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize link rendering to prevent javascript: URLs
                  a: ({ href, children }) => {
                    const isSafe =
                      href && (href.startsWith("http://") || href.startsWith("https://"))
                    return isSafe ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    ) : (
                      <span>{children}</span>
                    )
                  },
                }}
              >
                {sanitizedContent}
              </ReactMarkdown>
            </div>

            {/* Reply button (only for top-level comments, not for replies) */}
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-8 px-2 text-xs"
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                Reply
              </Button>
            )}

            {/* Inline reply form */}
            {isReplying && (
              <div className="mt-3 pl-4 border-l-2 border-muted">
                <NewCommentForm
                  entityType={entityType}
                  entityId={entityId}
                  projectId={projectId}
                  parentCommentId={comment.id}
                  onSuccess={() => setIsReplying(false)}
                  onCancel={() => setIsReplying(false)}
                  placeholder="Write a reply..."
                  autoFocus
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
