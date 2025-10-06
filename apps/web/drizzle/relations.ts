import { relations } from "drizzle-orm/relations"
import {
  users,
  accounts,
  sessions,
  addresses,
  projects,
  costs,
  categories,
  contacts,
  documents,
  events,
  projectAccess,
  projectContact,
} from "./schema"

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  projects: many(projects),
  costs: many(costs),
  projectAccesses_userId: many(projectAccess, {
    relationName: "projectAccess_userId_users_id",
  }),
  projectAccesses_invitedBy: many(projectAccess, {
    relationName: "projectAccess_invitedBy_users_id",
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  address: one(addresses, {
    fields: [projects.addressId],
    references: [addresses.id],
  }),
  user: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  costs: many(costs),
  documents: many(documents),
  events: many(events),
  projectAccesses: many(projectAccess),
  projectContacts: many(projectContact),
}))

export const addressesRelations = relations(addresses, ({ many }) => ({
  projects: many(projects),
  contacts: many(contacts),
}))

export const costsRelations = relations(costs, ({ one }) => ({
  project: one(projects, {
    fields: [costs.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [costs.categoryId],
    references: [categories.id],
  }),
  contact: one(contacts, {
    fields: [costs.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [costs.createdById],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  costs: many(costs),
  documents: many(documents),
  events: many(events),
  contacts: many(contacts),
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  costs: many(costs),
  projectContacts: many(projectContact),
  address: one(addresses, {
    fields: [contacts.addressId],
    references: [addresses.id],
  }),
  category: one(categories, {
    fields: [contacts.categoryId],
    references: [categories.id],
  }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [documents.categoryId],
    references: [categories.id],
  }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
}))

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.projectId],
    references: [projects.id],
  }),
  user_userId: one(users, {
    fields: [projectAccess.userId],
    references: [users.id],
    relationName: "projectAccess_userId_users_id",
  }),
  user_invitedBy: one(users, {
    fields: [projectAccess.invitedBy],
    references: [users.id],
    relationName: "projectAccess_invitedBy_users_id",
  }),
}))

export const projectContactRelations = relations(projectContact, ({ one }) => ({
  project: one(projects, {
    fields: [projectContact.projectId],
    references: [projects.id],
  }),
  contact: one(contacts, {
    fields: [projectContact.contactId],
    references: [contacts.id],
  }),
}))
