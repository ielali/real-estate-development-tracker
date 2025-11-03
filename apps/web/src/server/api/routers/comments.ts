/**
 * Comments Router
 * Story 8.3: Threaded Comments on Entities
 *
 * Handles CRUD operations for comments on costs, documents, and events
 * Implements one-level nesting, RBAC, and notification triggers
 */

import { z } from "zod"
import { eq, and, isNull, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { comments } from "@/server/db/schema/comments"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { projects } from "@/server/db/schema/projects"

/**
 * Zod schema for comment entity types
 */
const entityTypeSchema = z.enum(["cost", "document", "event"])

/**
 * Comments Router
 */
export const commentsRouter = createTRPCRouter({
  /**
   * List comments for an entity
   * Returns all non-deleted comments with user information
   * Sorted chronologically (oldest first)
   */
  list: protectedProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Query comments for this entity
      const commentsList = await ctx.db.query.comments.findMany({
        where: and(
          eq(comments.entityType, input.entityType),
          eq(comments.entityId, input.entityId),
          isNull(comments.deletedAt)
        ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
      })

      return commentsList
    }),

  /**
   * Create a new comment
   * Validates RBAC, content length, and nesting rules
   * Triggers notifications to relevant users
   */
  create: protectedProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string(),
        projectId: z.string(),
        content: z
          .string()
          .min(1, "Comment cannot be empty")
          .max(2000, "Comment cannot exceed 2000 characters"),
        parentCommentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project access (RBAC check)
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
      })

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      const isOwner = project.ownerId === userId

      const access = await ctx.db.query.projectAccess.findFirst({
        where: and(
          eq(projectAccess.projectId, input.projectId),
          eq(projectAccess.userId, userId),
          isNull(projectAccess.deletedAt)
        ),
      })

      const hasAccess = isOwner || (access && access.acceptedAt !== null)

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        })
      }

      // If parentCommentId provided, validate nesting rules
      if (input.parentCommentId) {
        const parentComment = await ctx.db.query.comments.findFirst({
          where: eq(comments.id, input.parentCommentId),
        })

        if (!parentComment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          })
        }

        if (parentComment.deletedAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reply to a deleted comment",
          })
        }

        // Enforce one-level nesting only
        if (parentComment.parentCommentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot reply to a reply - only one level nesting allowed",
          })
        }
      }

      // Create comment
      const [newComment] = await ctx.db
        .insert(comments)
        .values({
          userId,
          entityType: input.entityType,
          entityId: input.entityId,
          projectId: input.projectId,
          content: input.content,
          parentCommentId: input.parentCommentId ?? null,
        })
        .returning()

      // TODO: Trigger notification generation (Story 8.3 - notifications task)
      // This will be implemented in the notification service integration task
      // await notifyCommentAdded({
      //   commentId: newComment.id,
      //   entityType: input.entityType,
      //   entityId: input.entityId,
      //   projectId: input.projectId,
      //   authorId: userId,
      //   content: input.content,
      // })

      // Return comment with user info
      const commentWithUser = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, newComment.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      return commentWithUser!
    }),

  /**
   * Update a comment
   * Only the comment author can edit
   */
  update: protectedProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
        content: z
          .string()
          .min(1, "Comment cannot be empty")
          .max(2000, "Comment cannot exceed 2000 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find comment
      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, input.commentId),
      })

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        })
      }

      // Verify ownership
      if (comment.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        })
      }

      // Update comment
      const [updated] = await ctx.db
        .update(comments)
        .set({
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, input.commentId))
        .returning()

      // Return updated comment with user info
      const commentWithUser = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, updated.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      return commentWithUser!
    }),

  /**
   * Delete a comment (soft delete)
   * Author can delete own comments
   * Project owner can delete any comment
   */
  delete: protectedProcedure
    .input(
      z.object({
        commentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find comment
      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, input.commentId),
      })

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        })
      }

      // Get project to check ownership
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, comment.projectId),
      })

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      const isCommentOwner = comment.userId === userId
      const isProjectOwner = project.ownerId === userId

      if (!isCommentOwner && !isProjectOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments or be the project owner",
        })
      }

      // Soft delete
      await ctx.db
        .update(comments)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(comments.id, input.commentId))

      return { success: true }
    }),

  /**
   * Get comment count for an entity
   * Used for displaying badges on entity cards
   */
  getCount: protectedProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(
          and(
            eq(comments.entityType, input.entityType),
            eq(comments.entityId, input.entityId),
            isNull(comments.deletedAt)
          )
        )

      return Number(result[0]?.count ?? 0)
    }),
})
