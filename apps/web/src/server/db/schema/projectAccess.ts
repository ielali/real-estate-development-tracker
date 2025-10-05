import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { users } from "./users"

export const projectAccess = pgTable("project_access", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  permission: text("permission").notNull().default("view"),
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  invitedBy: text("invited_by").references(() => users.id),
})
