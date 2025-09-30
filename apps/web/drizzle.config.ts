import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/dev.db",
  },
  verbose: true,
  strict: true,
})
