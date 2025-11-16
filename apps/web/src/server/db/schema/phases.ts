import { pgTable, varchar, integer, timestamp, text } from "drizzle-orm/pg-core"
import { projects } from "./projects"

/**
 * Project Phases Table
 *
 * Represents construction phases for a project (e.g., Foundation, Framing, MEP).
 * Phases track progress, dates, and status for each stage of construction.
 */
export const phases = pgTable("phases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  // Phase identification
  name: varchar("name", { length: 255 }).notNull(),
  phaseNumber: integer("phase_number").notNull(), // Display order: 1, 2, 3...

  // Standard construction phase type (for templates and categorization)
  // Examples: "foundation", "framing", "mep_rough", "interior", etc.
  phaseType: varchar("phase_type", { length: 100 }),

  // Planned dates (from initial schedule)
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),

  // Actual dates (when work started/completed)
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),

  // Progress tracking
  progress: integer("progress").default(0).notNull(), // 0-100
  status: varchar("status", { length: 50 }).default("planned").notNull(),
  // Status values: "planned", "in-progress", "complete", "delayed"

  // Additional information
  description: text("description"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Phase = typeof phases.$inferSelect
export type NewPhase = typeof phases.$inferInsert
