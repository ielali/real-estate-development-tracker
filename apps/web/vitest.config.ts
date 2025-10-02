import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    isolate: true,
    pool: "threads",
    hookTimeout: 60000, // 60s for container startup
    testTimeout: 30000, // 30s per test
    env: {
      NODE_ENV: "test",
      // Dummy database URL to prevent main db connection during test imports
      NETLIFY_DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
