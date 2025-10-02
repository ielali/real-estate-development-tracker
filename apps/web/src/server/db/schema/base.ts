import { text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const baseEntityFields = {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`current_timestamp`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`current_timestamp`),
  deletedAt: timestamp("deleted_at"),
}
