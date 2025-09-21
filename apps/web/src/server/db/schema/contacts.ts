import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"
import { categories } from "./categories"
import { addresses } from "./addresses"

export const contacts = sqliteTable("contacts", {
  ...baseEntityFields,
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  addressId: text("address_id").references(() => addresses.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  notes: text("notes"),
})
