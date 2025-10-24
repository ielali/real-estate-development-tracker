import { defineConfig } from "drizzle-kit"
import { getDatabaseUrl } from "./src/server/db/get-database-url"

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
})
