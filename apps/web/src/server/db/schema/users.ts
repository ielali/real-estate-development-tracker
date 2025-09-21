import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"

export const users = sqliteTable("users", {
  ...baseEntityFields,
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "partner"] })
    .notNull()
    .default("partner"),
})
