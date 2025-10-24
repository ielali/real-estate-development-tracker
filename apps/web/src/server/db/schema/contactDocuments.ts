import { pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { baseEntityFields } from "./base"
import { contacts } from "./contacts"
import { documents } from "./documents"

export const contactDocuments = pgTable(
  "contact_documents",
  {
    ...baseEntityFields,
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueContactDocument: uniqueIndex("unique_contact_document_idx")
      .on(table.contactId, table.documentId)
      .where(sql`deleted_at IS NULL`),
    contactIdx: index("contact_documents_contact_idx").on(table.contactId),
    documentIdx: index("contact_documents_document_idx").on(table.documentId),
  })
)
