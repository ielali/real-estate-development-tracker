import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core"

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: ["contact", "cost", "document", "event"],
    }).notNull(),
    displayName: text("display_name").notNull(),
    parentId: text("parent_id"),
  },
  (table) => {
    return {
      uniqueIdType: unique().on(table.id, table.type),
    }
  }
)
