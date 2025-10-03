import { defineConfig } from "vitest/config"
import path from "path"
import { readFileSync } from "fs"

// Load environment variables from .env file
const envFile = readFileSync(path.join(__dirname, ".env"), "utf-8")
const env: Record<string, string> = {}
envFile.split("\n").forEach((line) => {
  const match = line.match(/^([^#=]+)=(.+)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
})

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
      NEON_TEST_DATABASE_URL: env.NEON_TEST_DATABASE_URL || process.env.NEON_TEST_DATABASE_URL,
      NETLIFY_DATABASE_URL: env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
