import { pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { baseEntityFields } from "./base"
import { events } from "./events"
import { documents } from "./documents"

export const eventDocuments = pgTable(
  "event_documents",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueEventDocument: uniqueIndex("unique_event_document_idx")
      .on(table.eventId, table.documentId)
      .where(sql`deleted_at IS NULL`),
    eventIdx: index("event_documents_event_idx").on(table.eventId),
    documentIdx: index("event_documents_document_idx").on(table.documentId),
  })
)
