import { pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { baseEntityFields } from "./base"
import { events } from "./events"
import { contacts } from "./contacts"

export const eventContacts = pgTable(
  "event_contacts",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueEventContact: uniqueIndex("unique_event_contact_idx")
      .on(table.eventId, table.contactId)
      .where(sql`deleted_at IS NULL`),
    eventIdx: index("event_contacts_event_idx").on(table.eventId),
    contactIdx: index("event_contacts_contact_idx").on(table.contactId),
  })
)
