import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { users } from "./users"

export const projectAccess = pgTable("project_access", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  userId: text("user_id").references(() => users.id), // Nullable for pending invitations
  invitedEmail: text("invited_email"), // Email address for pending invitations (before user accepts)
  permission: text("permission").notNull().default("view"),
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  invitedBy: text("invited_by").references(() => users.id),
  invitationToken: text("invitation_token").unique(), // Secure token for invitation acceptance
  expiresAt: timestamp("expires_at"), // Invitation expiration (7 days from invitedAt)
})
