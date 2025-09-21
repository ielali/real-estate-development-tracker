import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  verbose: true,
  strict: true,
})
