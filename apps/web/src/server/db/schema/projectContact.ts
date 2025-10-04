import { pgTable, text } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { contacts } from "./contacts"

export const projectContact = pgTable("project_contact", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
})
