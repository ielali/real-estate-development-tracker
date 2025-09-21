import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { categories } from "./categories"

export const events = sqliteTable("events", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  relatedCostIds: text("related_cost_ids"),
  relatedDocumentIds: text("related_document_ids"),
  relatedContactIds: text("related_contact_ids"),
})
