import { sql } from "drizzle-orm"
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(current_timestamp)`)
    .notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""), // For Better-auth compatibility
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role", { enum: ["admin", "partner"] })
    .notNull()
    .default("partner"),
})

export type User = typeof users.$inferSelect
