import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { users } from "./users"
import { addresses } from "./addresses"

export const projects = sqliteTable("projects", {
  ...baseEntityFields,
  name: text("name").notNull(),
  description: text("description"),
  addressId: text("address_id").references(() => addresses.id),
  projectType: text("project_type", {
    enum: ["new_build", "renovation", "development", "maintenance"],
  }).notNull(),
  status: text("status", {
    enum: ["planning", "active", "on_hold", "completed", "archived"],
  })
    .notNull()
    .default("planning"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  totalBudget: integer("total_budget"),
})
