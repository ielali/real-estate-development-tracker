import { sql } from "drizzle-orm"
import { pgTable, text, boolean, timestamp, uuid, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { notifications } from "./notifications"

/**
 * Digest type enum
 */
export const DigestTypeEnum = {
  DAILY: "daily",
  WEEKLY: "weekly",
} as const

export type DigestType = (typeof DigestTypeEnum)[keyof typeof DigestTypeEnum]

/**
 * Digest Queue table
 * Queues notifications for batch email delivery (daily/weekly digests)
 * Story 8.2: AC #8, #9, #12 - Digest email scheduling and processing
 */
export const digestQueue = pgTable(
  "digest_queue",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    digestType: text("digest_type").notNull(), // daily or weekly
    scheduledFor: timestamp("scheduled_for").notNull(), // When to send digest
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`current_timestamp`),
  },
  (table) => ({
    userIdIdx: index("digest_queue_user_id_idx").on(table.userId),
    processedIdx: index("digest_queue_processed_idx").on(table.processed),
    scheduledForIdx: index("digest_queue_scheduled_for_idx").on(table.scheduledFor),
    digestTypeIdx: index("digest_queue_digest_type_idx").on(table.digestType),
  })
)

export type DigestQueueEntry = typeof digestQueue.$inferSelect
export type DigestQueueInsert = typeof digestQueue.$inferInsert
