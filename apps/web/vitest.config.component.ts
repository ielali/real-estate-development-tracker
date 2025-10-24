import { defineConfig } from "vitest/config"
import path from "path"

/**
 * Vitest configuration for component and hook tests (no database required)
 *
 * This config is specifically for frontend tests that don't need database access.
 * It runs faster and doesn't require NETLIFY_TEST_DATABASE_URL environment variable.
 *
 * Use this for:
 * - Component tests (src/components/**\/*.test.tsx)
 * - Hook tests (src/hooks/**\/*.test.ts)
 * - Utility tests (src/lib/**\/*.test.ts)
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup-component.ts"],
    isolate: true,

    // Include only component, hook, and utility tests
    include: [
      "src/components/**/*.test.{ts,tsx}",
      "src/hooks/**/*.test.{ts,tsx}",
      "src/lib/utils/**/*.test.{ts,tsx}",
    ],

    // Exclude API/server tests
    exclude: ["node_modules", "src/server/**/*.test.{ts,tsx}", "src/api/**/*.test.{ts,tsx}"],

    // Faster timeout for component tests
    hookTimeout: 10000,
    testTimeout: 5000,

    env: {
      NODE_ENV: "test",
    },

    // Improve test isolation
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
