/**
 * Notifications Schema
 *
 * Story 8.1: In-App Notification System
 *
 * Table: notifications
 * - Stores in-app notifications for user activities
 * - Real-time updates via polling (30s interval)
 * - Soft delete via read status tracking
 * - Automatic cleanup of old notifications (>90 days)
 */

import { pgTable, text, timestamp, boolean, index, uuid } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { projects } from "./projects"

/**
 * Notification Types
 * Defines all possible notification types that can be triggered
 */
export const NotificationType = {
  COST_ADDED: "cost_added",
  LARGE_EXPENSE: "large_expense",
  DOCUMENT_UPLOADED: "document_uploaded",
  TIMELINE_EVENT: "timeline_event",
  PARTNER_INVITED: "partner_invited",
  COMMENT_ADDED: "comment_added",
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

/**
 * Entity Types for Notifications
 * References the type of entity the notification is about
 */
export const NotificationEntityType = {
  COST: "cost",
  DOCUMENT: "document",
  EVENT: "event",
  PROJECT: "project",
} as const

export type NotificationEntityType =
  (typeof NotificationEntityType)[keyof typeof NotificationEntityType]

/**
 * Notifications Table
 *
 * Stores in-app notifications for users about project activities.
 * Notifications are created when:
 * - Costs are added (especially large expenses >= $10k)
 * - Documents are uploaded
 * - Timeline events are created
 * - Partners are invited
 * - Comments are added
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // One of NotificationType values
    entityType: text("entity_type").notNull(), // One of NotificationEntityType values
    entityId: text("entity_id").notNull(), // ID of the related entity
    projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
    message: text("message").notNull(), // Human-readable notification message
    read: boolean("read").notNull().default(false), // Read/unread status
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Index for efficient queries by user
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    // Composite index for unread notifications query (most common)
    userIdReadIdx: index("notifications_user_id_read_idx").on(table.userId, table.read),
    // Index for cleanup job (delete notifications > 90 days)
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    // Index for project-specific notifications
    projectIdIdx: index("notifications_project_id_idx").on(table.projectId),
  })
)

/**
 * Notifications Relations
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}))

/**
 * TypeScript types inferred from schema
 */
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
