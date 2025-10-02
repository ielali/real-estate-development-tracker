import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
