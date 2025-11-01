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
    reporters: [
      "default", // Keep terminal output
      ["json", { outputFile: "test-results/results.json" }],
    ],
    // Exclude e2e tests (run with Playwright separately)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**", // Exclude E2E tests from unit test suite
      "**/.{idea,git,cache,output,temp}/**",
      "**/.next/**",
    ],
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid database conflicts
      },
    },
    hookTimeout: 60000, // 60s for migrations (CI has higher latency)
    testTimeout: 30000, // 30s per test (remote DB operations in CI)
    retry: process.env.CI ? 2 : 0, // Retry flaky tests in CI only

    // Allow tests to use environment-specific configuration
    environmentMatchGlobs: [
      // API/server tests use node environment (must come before jsdom)
      ["**/server/**/*.test.{ts,tsx}", "node"],
      ["**/api/**/*.test.{ts,tsx}", "node"],
      // Component and hook tests use jsdom
      ["**/components/**/*.test.{ts,tsx}", "jsdom"],
      ["**/hooks/**/*.test.{ts,tsx}", "jsdom"],
    ],

    env: {
      NODE_ENV: "test",
      // Test database - getDatabaseUrl() will use NETLIFY_TEST_DATABASE_URL when NODE_ENV=test
      NETLIFY_TEST_DATABASE_URL: process.env.NETLIFY_TEST_DATABASE_URL,
      DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL || "http://localhost:3000",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "test-secret-minimum-32-chars-long",
    },

    // Improve test isolation and reliability
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
})
