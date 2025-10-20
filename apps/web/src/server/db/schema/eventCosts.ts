import { pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { baseEntityFields } from "./base"
import { events } from "./events"
import { costs } from "./costs"

export const eventCosts = pgTable(
  "event_costs",
  {
    ...baseEntityFields,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    costId: text("cost_id")
      .notNull()
      .references(() => costs.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueEventCost: uniqueIndex("unique_event_cost_idx")
      .on(table.eventId, table.costId)
      .where(sql`deleted_at IS NULL`),
    eventIdx: index("event_costs_event_idx").on(table.eventId),
    costIdx: index("event_costs_cost_idx").on(table.costId),
  })
)
