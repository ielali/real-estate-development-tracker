import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { contacts } from "./contacts"
import { users } from "./users"
import { categories } from "./categories"

export const costs = pgTable("costs", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  amount: bigint("amount", { mode: "number" }).notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  date: timestamp("date").notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  documentIds: text("document_ids"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
})
