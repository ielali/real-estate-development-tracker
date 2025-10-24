import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { categories } from "./categories"
import { users } from "./users"

export const events = pgTable("events", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
})
