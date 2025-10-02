import "@testing-library/jest-dom"
import { afterAll } from "vitest"
import { cleanupAllTestContainers } from "./test-db"

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

// Cleanup all test containers after all tests complete
afterAll(async () => {
  await cleanupAllTestContainers()
})
