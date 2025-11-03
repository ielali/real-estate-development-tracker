"use client"

/**
 * CommentThread Component
 * Story 8.3: Threaded Comments on Entities
 *
 * Main container for comment threads
 * Features:
 * - Loads and displays all comments for an entity
 * - Groups top-level comments with their replies
 * - Real-time updates (30s polling)
 * - Loading and empty states
 * - New comment form at bottom
 */

import { useSession } from "@/lib/auth-client"
import { MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/trpc/react"
import { CommentItem } from "./CommentItem"
import { NewCommentForm } from "./NewCommentForm"

interface CommentThreadProps {
  entityType: "cost" | "document" | "event"
  entityId: string
  projectId: string
  projectOwnerId: string
}

export function CommentThread({
  entityType,
  entityId,
  projectId,
  projectOwnerId,
}: CommentThreadProps) {
  const { data: session } = useSession()

  // Fetch comments with 30s polling for real-time updates
  const { data: comments, isLoading } = api.comments.list.useQuery(
    { entityType, entityId },
    {
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      staleTime: 20000, // Consider data stale after 20s
    }
  )

  if (!session?.user) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="space-y-4">
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      </div>
    )
  }

  // Group comments by parent/child
  const topLevelComments = comments?.filter((c) => !c.parentCommentId) ?? []
  const replyMap = new Map<string, typeof comments>()

  comments?.forEach((comment) => {
    if (comment.parentCommentId) {
      const existing = replyMap.get(comment.parentCommentId) ?? []
      replyMap.set(comment.parentCommentId, [...existing, comment])
    }
  })

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments
        {comments && comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
        )}
      </h3>

      {/* Empty state */}
      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium mb-1">No comments yet</p>
          <p className="text-sm text-muted-foreground">Be the first to comment on this item!</p>
        </div>
      ) : (
        /* Comments list */
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Top-level comment */}
              <CommentItem
                comment={comment}
                entityType={entityType}
                entityId={entityId}
                projectId={projectId}
                currentUserId={session.user.id}
                projectOwnerId={projectOwnerId}
                isReply={false}
              />

              {/* Replies to this comment */}
              {replyMap.get(comment.id)?.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  entityType={entityType}
                  entityId={entityId}
                  projectId={projectId}
                  currentUserId={session.user.id}
                  projectOwnerId={projectOwnerId}
                  isReply={true}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className="pt-4 border-t">
        <NewCommentForm
          entityType={entityType}
          entityId={entityId}
          projectId={projectId}
          placeholder="Add a comment..."
        />
      </div>
    </div>
  )
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}
