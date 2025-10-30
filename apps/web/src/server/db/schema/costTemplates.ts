import { pgTable, text, bigint } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { users } from "./users"
import { projects } from "./projects"
import { categories } from "./categories"
import { contacts } from "./contacts"

export const costTemplates = pgTable("cost_templates", {
  ...baseEntityFields,
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  amount: bigint("amount", { mode: "number" }),
  description: text("description").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  contactId: text("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
})
