import "@testing-library/jest-dom"
import { beforeAll } from "vitest"

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

// Force NODE_ENV to test to ensure database isolation
beforeAll(async () => {
  // Note: NODE_ENV is set via vitest.config.ts environment variables
  // This ensures proper database isolation for tests
})
