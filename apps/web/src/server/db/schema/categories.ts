import { pgTable, text, unique } from "drizzle-orm/pg-core"

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    displayName: text("display_name").notNull(),
    parentId: text("parent_id"),
  },
  (table) => {
    return {
      uniqueIdType: unique().on(table.id, table.type),
    }
  }
)
