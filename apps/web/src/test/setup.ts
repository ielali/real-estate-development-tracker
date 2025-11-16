import "@testing-library/jest-dom"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, vi } from "vitest"
import { cleanupAllTestDatabases } from "./test-db"

// Cleanup DOM after each test to prevent pollution
afterEach(() => {
  cleanup()
})

// Global mock for Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

// Mock pointer capture and scroll for Radix UI components
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false)
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {})
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {})
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {})
}

// Cleanup all test databases after all tests complete
afterAll(async () => {
  await cleanupAllTestDatabases()
})
