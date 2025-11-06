/**
 * Comments Schema
 * Story 8.3: Threaded Comments on Entities
 *
 * Supports commenting on costs, documents, and timeline events
 * Implements one-level nested replies (comment -> reply only)
 * Soft delete pattern for maintaining thread integrity
 */

import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { projects } from "./projects"

/**
 * Entity types that support comments
 */
export const CommentEntityType = {
  COST: "cost",
  DOCUMENT: "document",
  EVENT: "event",
} as const

export type CommentEntityType = (typeof CommentEntityType)[keyof typeof CommentEntityType]

/**
 * Comments table
 * Supports threaded discussions on project entities
 */
export const comments: any = pgTable(
  // eslint-disable-line @typescript-eslint/no-explicit-any
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // User who created the comment
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Entity being commented on
    entityType: text("entity_type").notNull(), // One of CommentEntityType
    entityId: text("entity_id").notNull(),

    // Project context (for RBAC and cleanup)
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    // Comment content (max 2000 characters enforced in Zod)
    content: text("content").notNull(),

    // Optional parent comment for replies (one-level nesting only)
    parentCommentId: uuid("parent_comment_id").references(() => comments.id, {
      onDelete: "set null",
    }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Soft delete - maintains thread integrity
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    // Composite index for fast entity comment lookups
    // Most common query: "get all comments for this entity"
    entityIdx: index("comments_entity_idx").on(table.entityType, table.entityId),

    // Index for user comment queries
    userIdIdx: index("comments_user_id_idx").on(table.userId),

    // Index for project-scoped queries
    projectIdIdx: index("comments_project_id_idx").on(table.projectId),

    // Index for reply queries
    parentIdIdx: index("comments_parent_id_idx").on(table.parentCommentId),
  })
)

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
