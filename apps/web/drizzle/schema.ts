import { pgTable, text, timestamp, unique, boolean, foreignKey, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const verifications = pgTable("verifications", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const auditLog = pgTable("audit_log", {
  id: text().primaryKey().notNull(),
  timestamp: timestamp({ mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  userId: text("user_id").notNull(),
  action: text().notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changes: text(),
  metadata: text(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
})

export const users = pgTable(
  "users",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    email: text().notNull(),
    name: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: text().default("partner").notNull(),
  },
  (table) => [unique("users_email_unique").on(table.email)]
)

export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "string" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "string" }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "accounts_user_id_users_id_fk",
    }).onDelete("cascade"),
  ]
)

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "sessions_user_id_users_id_fk",
    }).onDelete("cascade"),
    unique("sessions_token_unique").on(table.token),
  ]
)

export const addresses = pgTable("addresses", {
  id: text().primaryKey().notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
  streetNumber: text("street_number"),
  streetName: text("street_name"),
  streetType: text("street_type"),
  suburb: text(),
  state: text(),
  postcode: text(),
  country: text().default("Australia"),
  formattedAddress: text("formatted_address"),
})

export const projects = pgTable(
  "projects",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    name: text().notNull(),
    description: text(),
    addressId: text("address_id"),
    projectType: text("project_type").notNull(),
    status: text().default("planning").notNull(),
    startDate: timestamp("start_date", { mode: "string" }),
    endDate: timestamp("end_date", { mode: "string" }),
    ownerId: text("owner_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    totalBudget: bigint("total_budget", { mode: "number" }),
  },
  (table) => [
    foreignKey({
      columns: [table.addressId],
      foreignColumns: [addresses.id],
      name: "projects_address_id_addresses_id_fk",
    }),
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
      name: "projects_owner_id_users_id_fk",
    }),
  ]
)

export const costs = pgTable(
  "costs",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    projectId: text("project_id").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    amount: bigint({ mode: "number" }).notNull(),
    description: text().notNull(),
    categoryId: text("category_id").notNull(),
    date: timestamp({ mode: "string" }).notNull(),
    contactId: text("contact_id"),
    documentIds: text("document_ids"),
    createdById: text("created_by_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "costs_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "costs_category_id_categories_id_fk",
    }),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: "costs_contact_id_contacts_id_fk",
    }),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "costs_created_by_id_users_id_fk",
    }),
  ]
)

export const categories = pgTable(
  "categories",
  {
    id: text().primaryKey().notNull(),
    type: text().notNull(),
    displayName: text("display_name").notNull(),
    parentId: text("parent_id"),
    // Tax metadata fields (Story 2.3)
    taxDeductible: boolean("tax_deductible"), // null = not specified (custom/non-cost)
    taxCategory: text("tax_category"), // ATO tax category for reporting
    notes: text(), // Accountant context notes
    isCustom: boolean("is_custom").default(false).notNull(), // User-created vs predefined
    isArchived: boolean("is_archived").default(false).notNull(), // Soft delete for custom
    createdById: text("created_by_id"), // Creator for custom categories
    createdAt: timestamp("created_at", { mode: "string" }), // Audit trail for custom categories
  },
  (table) => [
    unique("categories_id_type_unique").on(table.id, table.type),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [users.id],
      name: "categories_created_by_id_users_id_fk",
    }),
  ]
)

export const documents = pgTable(
  "documents",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    projectId: text("project_id").notNull(),
    fileName: text("file_name").notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    blobUrl: text("blob_url").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "documents_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "documents_category_id_categories_id_fk",
    }),
  ]
)

export const events = pgTable(
  "events",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    projectId: text("project_id").notNull(),
    title: text().notNull(),
    description: text(),
    date: timestamp({ mode: "string" }).notNull(),
    categoryId: text("category_id").notNull(),
    relatedCostIds: text("related_cost_ids"),
    relatedDocumentIds: text("related_document_ids"),
    relatedContactIds: text("related_contact_ids"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "events_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "events_category_id_categories_id_fk",
    }),
  ]
)

export const projectAccess = pgTable(
  "project_access",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    projectId: text("project_id").notNull(),
    userId: text("user_id").notNull(),
    permission: text().default("view").notNull(),
    invitedAt: timestamp("invited_at", { mode: "string" }),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
    invitedBy: text("invited_by"),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_access_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "project_access_user_id_users_id_fk",
    }),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "project_access_invited_by_users_id_fk",
    }),
  ]
)

export const projectContact = pgTable(
  "project_contact",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    projectId: text("project_id").notNull(),
    contactId: text("contact_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_contact_project_id_projects_id_fk",
    }),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: "project_contact_contact_id_contacts_id_fk",
    }),
  ]
)

export const contacts = pgTable(
  "contacts",
  {
    id: text().primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    company: text(),
    email: text(),
    phone: text(),
    mobile: text(),
    addressId: text("address_id"),
    categoryId: text("category_id").notNull(),
    notes: text(),
    website: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.addressId],
      foreignColumns: [addresses.id],
      name: "contacts_address_id_addresses_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "contacts_category_id_categories_id_fk",
    }),
  ]
)
