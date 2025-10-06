import { pgTable, text } from "drizzle-orm/pg-core"
import { baseEntityFields } from "./base"
import { categories } from "./categories"
import { addresses } from "./addresses"

export const contacts = pgTable("contacts", {
  ...baseEntityFields,
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  website: text("website"),
  addressId: text("address_id").references(() => addresses.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  notes: text("notes"),
})
