import { sql } from "drizzle-orm"
import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core"
import { users } from "./users"

/**
 * Digest frequency enum
 */
export const DigestFrequencyEnum = {
  IMMEDIATE: "immediate",
  DAILY: "daily",
  WEEKLY: "weekly",
  NEVER: "never",
} as const

export type DigestFrequency = (typeof DigestFrequencyEnum)[keyof typeof DigestFrequencyEnum]

/**
 * Notification Preferences table
 * Stores user preferences for email notifications
 */
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    emailOnCost: boolean("email_on_cost").notNull().default(true),
    emailOnLargeExpense: boolean("email_on_large_expense").notNull().default(true),
    emailOnDocument: boolean("email_on_document").notNull().default(true),
    emailOnTimeline: boolean("email_on_timeline").notNull().default(true),
    emailOnComment: boolean("email_on_comment").notNull().default(true),
    emailDigestFrequency: text("email_digest_frequency").notNull().default("immediate"),
    timezone: text("timezone").notNull().default("Australia/Sydney"),
    updatedAt: timestamp("updated_at")
      .default(sql`current_timestamp`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("notification_preferences_user_id_idx").on(table.userId),
  })
)

export type NotificationPreferences = typeof notificationPreferences.$inferSelect
export type NotificationPreferencesInsert = typeof notificationPreferences.$inferInsert
