import { pgTable, text, bigint } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { projects } from "./projects"
import { categories } from "./categories"
import { users } from "./users"

export const documents = pgTable("documents", {
  ...baseEntityFields,
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull(),
  blobUrl: text("blob_url").notNull(),
  thumbnailUrl: text("thumbnail_url"), // Generated thumbnail for images (Story 3.2)
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  uploadedById: text("uploaded_by_id")
    .notNull()
    .references(() => users.id),
})

export type Document = typeof documents.$inferSelect
