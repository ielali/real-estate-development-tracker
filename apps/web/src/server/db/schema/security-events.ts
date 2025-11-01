/**
 * Security Events Schema
 *
 * Story 6.3: Tracks user security events for activity logging and monitoring
 *
 * Table: security_events
 * - Stores all security-related events (2FA, backups, etc.)
 * - Append-only for audit trail integrity
 * - Users can view their own events
 * - Admins can view aggregated metrics only
 */

import { pgTable, text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

/**
 * Security Event Types
 * Defines all possible security event types that can be logged
 */
export const SecurityEventType = {
  TWO_FA_ENABLED: "2fa_enabled",
  TWO_FA_DISABLED: "2fa_disabled",
  TWO_FA_LOGIN_SUCCESS: "2fa_login_success",
  TWO_FA_LOGIN_FAILURE: "2fa_login_failure",
  BACKUP_CODE_GENERATED: "backup_code_generated",
  BACKUP_CODE_USED: "backup_code_used",
  BACKUP_DOWNLOADED: "backup_downloaded",
} as const

export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType]

/**
 * Security Events Table
 */
export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // One of SecurityEventType values
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent").notNull(),
    metadata: jsonb("metadata"), // Additional event-specific data (JSON)
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Index for efficient queries by user and timestamp
    userIdTimestampIdx: index("security_events_user_id_timestamp_idx").on(
      table.userId,
      table.timestamp
    ),
  })
)

/**
 * Security Events Relations
 */
export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}))

/**
 * TypeScript types inferred from schema
 */
export type SecurityEvent = typeof securityEvents.$inferSelect
export type NewSecurityEvent = typeof securityEvents.$inferInsert
