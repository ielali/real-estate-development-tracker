/**
 * Vendor Ratings Schema
 * Story 9.3: Vendor Performance Metrics & Rating System
 *
 * Allows users to rate vendors (contacts) on a 1-5 star scale
 * One rating per user per vendor per project
 * Supports optional review text (max 500 characters)
 */

import { pgTable, text, integer, timestamp, unique, index } from "drizzle-orm/pg-core"
import { users } from "./users"
import { contacts } from "./contacts"
import { projects } from "./projects"

/**
 * Vendor ratings table
 * Tracks user ratings for vendors across different projects
 */
export const vendorRatings = pgTable(
  "vendor_ratings",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // User who created the rating
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Vendor being rated (contact)
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),

    // Project context for the rating
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    // Rating value (1-5 stars, validated in application logic)
    rating: integer("rating").notNull(),

    // Optional review text (max 500 characters enforced in Zod)
    review: text("review"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Soft delete - maintains rating history
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    // Unique constraint: one rating per user per vendor per project
    uniqueUserVendorProject: unique("unique_user_vendor_project").on(
      table.userId,
      table.contactId,
      table.projectId
    ),

    // Index for vendor metrics queries (most common: get all ratings for a vendor)
    contactIdx: index("idx_vendor_ratings_contact").on(table.contactId),

    // Index for user rating queries
    userIdx: index("idx_vendor_ratings_user").on(table.userId),

    // Index for project rating queries
    projectIdx: index("idx_vendor_ratings_project").on(table.projectId),
  })
)

export type VendorRating = typeof vendorRatings.$inferSelect
export type NewVendorRating = typeof vendorRatings.$inferInsert
