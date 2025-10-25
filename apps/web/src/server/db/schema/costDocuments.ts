import { pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { baseEntityFields } from "./base"
import { costs } from "./costs"
import { documents } from "./documents"

export const costDocuments = pgTable(
  "cost_documents",
  {
    ...baseEntityFields,
    costId: text("cost_id")
      .notNull()
      .references(() => costs.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueCostDocument: uniqueIndex("unique_cost_document_idx")
      .on(table.costId, table.documentId)
      .where(sql`deleted_at IS NULL`),
    costIdx: index("cost_documents_cost_idx").on(table.costId),
    documentIdx: index("cost_documents_document_idx").on(table.documentId),
  })
)
