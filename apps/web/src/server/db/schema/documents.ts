import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { categories } from "./categories"

export const documents = sqliteTable("documents", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  blobUrl: text("blob_url").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
})
