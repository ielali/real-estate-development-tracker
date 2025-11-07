import { pgTable, text, timestamp, bigint, customType } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { users } from "./users"
import { addresses } from "./addresses"

// Custom type for PostgreSQL tsvector (full-text search)
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector"
  },
})

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
  size: bigint("size", { mode: "number" }), // Square meters for cost-per-sqm calculation
  search_vector: tsvector("search_vector"),
})
