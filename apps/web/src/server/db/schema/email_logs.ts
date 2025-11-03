import { sql } from "drizzle-orm"
import { pgTable, text, integer, timestamp, uuid, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { notifications } from "./notifications"

/**
 * Email status enum
 */
export const EmailStatusEnum = {
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  BOUNCED: "bounced",
} as const

export type EmailStatus = (typeof EmailStatusEnum)[keyof typeof EmailStatusEnum]

/**
 * Email Logs table
 * Tracks email delivery status and retry attempts
 * Story 8.2: AC #13, #14 - Email delivery tracking and retry logic
 */
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationId: uuid("notification_id").references(() => notifications.id, {
      onDelete: "set null",
    }),
    emailType: text("email_type").notNull(), // cost_added, large_expense, document_uploaded, etc.
    recipientEmail: text("recipient_email").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("sent"),
    resendId: text("resend_id"), // Resend message ID for tracking
    attempts: integer("attempts").notNull().default(1),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at")
      .notNull()
      .default(sql`current_timestamp`),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => ({
    userIdIdx: index("email_logs_user_id_idx").on(table.userId),
    statusIdx: index("email_logs_status_idx").on(table.status),
    sentAtIdx: index("email_logs_sent_at_idx").on(table.sentAt),
  })
)

export type EmailLog = typeof emailLogs.$inferSelect
export type EmailLogInsert = typeof emailLogs.$inferInsert
