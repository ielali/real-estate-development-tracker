/**
 * Rate Limiter Tests
 *
 * Story 6.2: Tests for per-type backup rate limiting
 *
 * Test coverage:
 * - JSON backup rate limiting (5 per hour)
 * - ZIP backup rate limiting (2 per hour)
 * - Per-type tracking
 * - Window reset after 1 hour
 * - Multiple users
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { TypedRateLimiter, RATE_LIMITS } from "../rate-limiter"

describe("BackupRateLimiter", () => {
  let limiter: TypedRateLimiter

  beforeEach(() => {
    limiter = new TypedRateLimiter()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("check", () => {
    it("should allow requests within JSON limit (5 per hour)", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Should allow first 5 requests
      for (let i = 0; i < limit; i++) {
        expect(limiter.check(userId, "json", limit, window)).toBe(true)
      }

      // 6th request should be denied
      expect(limiter.check(userId, "json", limit, window)).toBe(false)
    })

    it("should allow requests within ZIP limit (2 per hour)", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.ZIP.MAX_REQUESTS
      const window = RATE_LIMITS.ZIP.WINDOW_MS

      // Should allow first 2 requests
      expect(limiter.check(userId, "zip", limit, window)).toBe(true)
      expect(limiter.check(userId, "zip", limit, window)).toBe(true)

      // 3rd request should be denied
      expect(limiter.check(userId, "zip", limit, window)).toBe(false)
    })

    it("should track JSON and ZIP limits separately", () => {
      const userId = "user-1"

      // Make 5 JSON requests (at limit)
      for (let i = 0; i < RATE_LIMITS.JSON.MAX_REQUESTS; i++) {
        expect(
          limiter.check(userId, "json", RATE_LIMITS.JSON.MAX_REQUESTS, RATE_LIMITS.JSON.WINDOW_MS)
        ).toBe(true)
      }

      // JSON should be at limit
      expect(
        limiter.check(userId, "json", RATE_LIMITS.JSON.MAX_REQUESTS, RATE_LIMITS.JSON.WINDOW_MS)
      ).toBe(false)

      // But ZIP should still allow requests
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(true)
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(true)

      // ZIP should now be at limit
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(false)
    })

    it("should track different users separately", () => {
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // User 1 makes 5 requests (at limit)
      for (let i = 0; i < limit; i++) {
        expect(limiter.check("user-1", "json", limit, window)).toBe(true)
      }

      // User 1 should be blocked
      expect(limiter.check("user-1", "json", limit, window)).toBe(false)

      // User 2 should still have full quota
      for (let i = 0; i < limit; i++) {
        expect(limiter.check("user-2", "json", limit, window)).toBe(true)
      }

      // User 2 should now be blocked
      expect(limiter.check("user-2", "json", limit, window)).toBe(false)
    })

    it("should reset after window expires", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make 5 requests (at limit)
      for (let i = 0; i < limit; i++) {
        expect(limiter.check(userId, "json", limit, window)).toBe(true)
      }

      // Should be blocked
      expect(limiter.check(userId, "json", limit, window)).toBe(false)

      // Advance time by 1 hour + 1ms
      vi.advanceTimersByTime(window + 1)

      // Should allow requests again
      expect(limiter.check(userId, "json", limit, window)).toBe(true)
    })

    it("should clean up expired entries", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make requests
      limiter.check(userId, "json", limit, window)

      // Advance time past window
      vi.advanceTimersByTime(window + 1)

      // Make new request (should trigger cleanup)
      limiter.check(userId, "json", limit, window)

      // Internal state should have cleaned up old entries
      const timeUntilReset = limiter.getTimeUntilReset(userId, "json")
      expect(timeUntilReset).toBeGreaterThan(0)
      expect(timeUntilReset).toBeLessThanOrEqual(window)
    })
  })

  describe("getTimeUntilReset", () => {
    it("should return correct time until reset", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make first request
      limiter.check(userId, "json", limit, window)

      // Get time until reset
      const timeUntilReset = limiter.getTimeUntilReset(userId, "json")

      // Should be close to 1 hour (within 100ms)
      expect(timeUntilReset).toBeGreaterThan(window - 100)
      expect(timeUntilReset).toBeLessThanOrEqual(window)
    })

    it("should return 0 if no requests made", () => {
      const userId = "user-1"

      const timeUntilReset = limiter.getTimeUntilReset(userId, "json")

      expect(timeUntilReset).toBe(0)
    })

    it("should return 0 if window has expired", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make request
      limiter.check(userId, "json", limit, window)

      // Advance time past window
      vi.advanceTimersByTime(window + 1000)

      const timeUntilReset = limiter.getTimeUntilReset(userId, "json")

      expect(timeUntilReset).toBe(0)
    })

    it("should decrease as time passes", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make request
      limiter.check(userId, "json", limit, window)

      const initialTime = limiter.getTimeUntilReset(userId, "json")

      // Advance time by 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000)

      const laterTime = limiter.getTimeUntilReset(userId, "json")

      // Should be approximately 30 minutes less
      expect(laterTime).toBeLessThan(initialTime)
      expect(laterTime).toBeGreaterThan(initialTime - (30 * 60 * 1000 + 100))
    })
  })

  describe("edge cases", () => {
    it("should handle rapid successive requests", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.ZIP.MAX_REQUESTS
      const window = RATE_LIMITS.ZIP.WINDOW_MS

      // Make 2 requests as fast as possible
      const result1 = limiter.check(userId, "zip", limit, window)
      const result2 = limiter.check(userId, "zip", limit, window)
      const result3 = limiter.check(userId, "zip", limit, window)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(false)
    })

    it("should handle requests at boundary of window", () => {
      const userId = "user-1"
      const limit = RATE_LIMITS.JSON.MAX_REQUESTS
      const window = RATE_LIMITS.JSON.WINDOW_MS

      // Make 5 requests (at limit)
      for (let i = 0; i < limit; i++) {
        expect(limiter.check(userId, "json", limit, window)).toBe(true)
      }

      // Advance time to exactly at window boundary
      vi.advanceTimersByTime(window)

      // Should still be blocked (window is exclusive)
      expect(limiter.check(userId, "json", limit, window)).toBe(false)

      // Advance time by 1ms past window
      vi.advanceTimersByTime(1)

      // Should now be allowed
      expect(limiter.check(userId, "json", limit, window)).toBe(true)
    })

    it("should handle mixed backup types for same user", () => {
      const userId = "user-1"

      // Alternate between JSON and ZIP
      expect(
        limiter.check(userId, "json", RATE_LIMITS.JSON.MAX_REQUESTS, RATE_LIMITS.JSON.WINDOW_MS)
      ).toBe(true)
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(true)
      expect(
        limiter.check(userId, "json", RATE_LIMITS.JSON.MAX_REQUESTS, RATE_LIMITS.JSON.WINDOW_MS)
      ).toBe(true)
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(true)

      // ZIP should now be at limit (2/2)
      expect(
        limiter.check(userId, "zip", RATE_LIMITS.ZIP.MAX_REQUESTS, RATE_LIMITS.ZIP.WINDOW_MS)
      ).toBe(false)

      // JSON should still have 3 more
      expect(
        limiter.check(userId, "json", RATE_LIMITS.JSON.MAX_REQUESTS, RATE_LIMITS.JSON.WINDOW_MS)
      ).toBe(true)
    })
  })

  describe("RATE_LIMITS constants", () => {
    it("should have correct JSON limits", () => {
      expect(RATE_LIMITS.JSON.MAX_REQUESTS).toBe(5)
      expect(RATE_LIMITS.JSON.WINDOW_MS).toBe(3600000) // 1 hour
    })

    it("should have correct ZIP limits", () => {
      expect(RATE_LIMITS.ZIP.MAX_REQUESTS).toBe(2)
      expect(RATE_LIMITS.ZIP.WINDOW_MS).toBe(3600000) // 1 hour
    })
  })
})
