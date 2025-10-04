import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at")
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .notNull(),
  deletedAt: timestamp("deleted_at"),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""), // For Better-auth compatibility
  emailVerified: boolean("email_verified").default(false).notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").notNull().default("partner"),
})

export type User = typeof users.$inferSelect
