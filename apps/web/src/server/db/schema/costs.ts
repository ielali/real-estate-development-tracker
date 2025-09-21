import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { contacts } from "./contacts"
import { users } from "./users"
import { categories } from "./categories"

export const costs = sqliteTable("costs", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  contactId: text("contact_id").references(() => contacts.id),
  documentIds: text("document_ids"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
})
