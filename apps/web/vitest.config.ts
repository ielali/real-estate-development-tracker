import { defineConfig } from "vitest/config"
import path from "path"
import dotenv from "dotenv"
import { existsSync } from "fs"

// Load environment variables from .env file (for local development)
// GitHub Actions will use secrets instead
const envPath = path.join(__dirname, ".env")
if (existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    isolate: true,
    pool: "forks", // Use forks instead of threads for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid database conflicts
      },
    },
    hookTimeout: 30000, // 30s for migrations
    testTimeout: 15000, // 15s per test
    env: {
      NODE_ENV: "test",
      NEON_TEST_DATABASE_URL: process.env.NEON_TEST_DATABASE_URL,
      NETLIFY_DATABASE_URL: process.env.NETLIFY_DATABASE_URL || process.env.NEON_TEST_DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
