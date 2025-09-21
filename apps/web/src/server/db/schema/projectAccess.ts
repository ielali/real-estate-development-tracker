import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { users } from "./users"

export const projectAccess = sqliteTable("project_access", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  permission: text("permission", {
    enum: ["view", "comment", "edit", "admin"],
  })
    .notNull()
    .default("view"),
  invitedAt: integer("invited_at", { mode: "timestamp" }),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  invitedBy: text("invited_by").references(() => users.id),
})
