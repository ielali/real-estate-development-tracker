import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auditLog = pgTable("audit_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timestamp: timestamp("timestamp")
    .notNull()
    .default(sql`current_timestamp`),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changes: text("changes"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
})
