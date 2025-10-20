export * from "./base"
export * from "./users"
export * from "./auth"
export * from "./addresses"
export * from "./projects"
export * from "./costs"
export * from "./contacts"
export * from "./documents"
export * from "./events"
export * from "./projectAccess"
export * from "./projectContact"
export * from "./eventContacts"
export * from "./eventDocuments"
export * from "./eventCosts"
export * from "./auditLog"
export * from "./categories"

import { relations } from "drizzle-orm"
import { users } from "./users"
import { addresses } from "./addresses"
import { projects } from "./projects"
import { costs } from "./costs"
import { contacts } from "./contacts"
import { documents } from "./documents"
import { events } from "./events"
import { projectAccess } from "./projectAccess"
import { projectContact } from "./projectContact"
import { eventContacts } from "./eventContacts"
import { eventDocuments } from "./eventDocuments"
import { eventCosts } from "./eventCosts"
import { categories } from "./categories"

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  projectAccess: many(projectAccess),
  createdCosts: many(costs),
}))

export const addressesRelations = relations(addresses, ({ many }) => ({
  projects: many(projects),
  contacts: many(contacts),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  address: one(addresses, {
    fields: [projects.addressId],
    references: [addresses.id],
  }),
  costs: many(costs),
  documents: many(documents),
  events: many(events),
  projectAccess: many(projectAccess),
  projectContacts: many(projectContact),
}))

export const costsRelations = relations(costs, ({ one }) => ({
  project: one(projects, {
    fields: [costs.projectId],
    references: [projects.id],
  }),
  contact: one(contacts, {
    fields: [costs.contactId],
    references: [contacts.id],
  }),
  category: one(categories, {
    fields: [costs.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [costs.createdById],
    references: [users.id],
  }),
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  category: one(categories, {
    fields: [contacts.categoryId],
    references: [categories.id],
  }),
  address: one(addresses, {
    fields: [contacts.addressId],
    references: [addresses.id],
  }),
  costs: many(costs),
  projects: many(projectContact),
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

export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  eventContacts: many(eventContacts),
  eventDocuments: many(eventDocuments),
  eventCosts: many(eventCosts),
}))

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectAccess.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [projectAccess.invitedBy],
    references: [users.id],
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

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}))

export const eventContactsRelations = relations(eventContacts, ({ one }) => ({
  event: one(events, {
    fields: [eventContacts.eventId],
    references: [events.id],
  }),
  contact: one(contacts, {
    fields: [eventContacts.contactId],
    references: [contacts.id],
  }),
}))

export const eventDocumentsRelations = relations(eventDocuments, ({ one }) => ({
  event: one(events, {
    fields: [eventDocuments.eventId],
    references: [events.id],
  }),
  document: one(documents, {
    fields: [eventDocuments.documentId],
    references: [documents.id],
  }),
}))

export const eventCostsRelations = relations(eventCosts, ({ one }) => ({
  event: one(events, {
    fields: [eventCosts.eventId],
    references: [events.id],
  }),
  cost: one(costs, {
    fields: [eventCosts.costId],
    references: [costs.id],
  }),
}))
