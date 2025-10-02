import "@testing-library/jest-dom"
import { beforeAll } from "vitest"

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

// Set up test environment variables
beforeAll(async () => {
  // Use the same database URL for tests as the main app
  // In a real environment, you'd want a separate test database
  if (!process.env.NETLIFY_DATABASE_URL) {
    process.env.NETLIFY_DATABASE_URL =
      process.env.NETLIFY_DATABASE_URL_TEST ||
      "postgresql://neondb_owner:npg_UcW7ZvSF1Gko@ep-shiny-meadow-aeijkztn-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
  }
})
