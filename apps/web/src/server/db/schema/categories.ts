import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  displayName: text("display_name").notNull(),
  parentId: text("parent_id"),

  // Tax metadata fields (Story 2.3)
  taxDeductible: boolean("tax_deductible"), // null = not specified (custom/non-cost)
  taxCategory: text("tax_category"), // ATO tax category for reporting
  notes: text("notes"), // Accountant context notes
  isCustom: boolean("is_custom").notNull().default(false), // User-created vs predefined
  isArchived: boolean("is_archived").notNull().default(false), // Soft delete for custom
  createdById: text("created_by_id").references(() => users.id), // Creator for custom categories
  createdAt: timestamp("created_at"), // Audit trail for custom categories
})
