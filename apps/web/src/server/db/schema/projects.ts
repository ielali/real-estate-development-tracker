import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { users } from "./users"
import { addresses } from "./addresses"

export const projects = pgTable("projects", {
  ...baseEntityFields,
  name: text("name").notNull(),
  description: text("description"),
  addressId: text("address_id").references(() => addresses.id),
  projectType: text("project_type").notNull(),
  status: text("status").notNull().default("planning"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  totalBudget: bigint("total_budget", { mode: "number" }),
})
