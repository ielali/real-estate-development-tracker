import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { baseEntityFields } from "./base"

export const addresses = sqliteTable("addresses", {
  ...baseEntityFields,
  streetNumber: text("street_number"),
  streetName: text("street_name"),
  streetType: text("street_type"),
  suburb: text("suburb"),
  state: text("state"),
  postcode: text("postcode"),
  country: text("country").default("Australia"),
  formattedAddress: text("formatted_address"),
})
