import { pgTable, text, timestamp, bigint, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { projects } from "./projects"
import { users } from "./users"

export const projectBackups = pgTable("project_backups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  backupType: text("backup_type", { enum: ["json", "zip"] }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  documentCount: integer("document_count").notNull().default(0),
  schemaVersion: text("schema_version").notNull().default("1.0.0"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`current_timestamp`),
})

export type ProjectBackup = typeof projectBackups.$inferSelect
