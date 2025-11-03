import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { EmailRateLimiter } from "../email-rate-limiter"

describe("EmailRateLimiter", () => {
  let rateLimiter: EmailRateLimiter

  beforeEach(() => {
    rateLimiter = new EmailRateLimiter()
  })

  afterEach(() => {
    rateLimiter.clearAll()
  })

  describe("canSendEmail", () => {
    it("allows first email for a user", () => {
      expect(rateLimiter.canSendEmail("user1")).toBe(true)
    })

    it("allows up to 10 emails within the hour", () => {
      const userId = "user1"

      // Send 10 emails
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.canSendEmail(userId)).toBe(true)
      }

      // 11th email should be blocked
      expect(rateLimiter.canSendEmail(userId)).toBe(false)
    })

    it("blocks 11th email within the hour", () => {
      const userId = "user1"

      // Send 10 emails
      for (let i = 0; i < 10; i++) {
        rateLimiter.canSendEmail(userId)
      }

      // 11th email blocked
      expect(rateLimiter.canSendEmail(userId)).toBe(false)

      // Still blocked on subsequent attempts
      expect(rateLimiter.canSendEmail(userId)).toBe(false)
    })

    it.skip("resets limit after 1 hour", () => {
      // TODO: Implement with proper time mocking
      // This test requires mocking Date.now() or using fake timers
    })

    it("tracks limits separately for different users", () => {
      const user1 = "user1"
      const user2 = "user2"

      // User 1 sends 10 emails
      for (let i = 0; i < 10; i++) {
        rateLimiter.canSendEmail(user1)
      }

      // User 1 blocked
      expect(rateLimiter.canSendEmail(user1)).toBe(false)

      // User 2 can still send
      expect(rateLimiter.canSendEmail(user2)).toBe(true)
    })

    it("allows large expense emails to bypass rate limiting", () => {
      const userId = "user1"

      // Send 10 regular emails
      for (let i = 0; i < 10; i++) {
        rateLimiter.canSendEmail(userId)
      }

      // 11th regular email blocked
      expect(rateLimiter.canSendEmail(userId, false)).toBe(false)

      // Large expense emails still allowed
      expect(rateLimiter.canSendEmail(userId, true)).toBe(true)
      expect(rateLimiter.canSendEmail(userId, true)).toBe(true)
      expect(rateLimiter.canSendEmail(userId, true)).toBe(true)
    })

    it("does not increment count for large expense emails", () => {
      const userId = "user1"

      // Send 5 large expense emails (should not count)
      for (let i = 0; i < 5; i++) {
        rateLimiter.canSendEmail(userId, true)
      }

      // Should still be able to send 10 regular emails
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.canSendEmail(userId, false)).toBe(true)
      }

      // 11th regular email blocked
      expect(rateLimiter.canSendEmail(userId, false)).toBe(false)
    })
  })

  describe("getCurrentCount", () => {
    it("returns zero count for new user", () => {
      const result = rateLimiter.getCurrentCount("user1")
      expect(result.count).toBe(0)
      expect(result.resetAt).toBeNull()
    })

    it("returns correct count after emails sent", () => {
      const userId = "user1"

      rateLimiter.canSendEmail(userId)
      rateLimiter.canSendEmail(userId)
      rateLimiter.canSendEmail(userId)

      const result = rateLimiter.getCurrentCount(userId)
      expect(result.count).toBe(3)
      expect(result.resetAt).toBeInstanceOf(Date)
    })

    it.skip("returns zero after limit expires", () => {
      // TODO: Implement with proper time mocking
    })
  })

  describe("reset", () => {
    it("resets limit for specific user", () => {
      const userId = "user1"

      // Send 10 emails
      for (let i = 0; i < 10; i++) {
        rateLimiter.canSendEmail(userId)
      }

      // Blocked
      expect(rateLimiter.canSendEmail(userId)).toBe(false)

      // Reset
      rateLimiter.reset(userId)

      // Can send again
      expect(rateLimiter.canSendEmail(userId)).toBe(true)
    })

    it("only resets specified user, not others", () => {
      const user1 = "user1"
      const user2 = "user2"

      // Both send 10 emails
      for (let i = 0; i < 10; i++) {
        rateLimiter.canSendEmail(user1)
        rateLimiter.canSendEmail(user2)
      }

      // Both blocked
      expect(rateLimiter.canSendEmail(user1)).toBe(false)
      expect(rateLimiter.canSendEmail(user2)).toBe(false)

      // Reset only user1
      rateLimiter.reset(user1)

      // User1 can send, user2 still blocked
      expect(rateLimiter.canSendEmail(user1)).toBe(true)
      expect(rateLimiter.canSendEmail(user2)).toBe(false)
    })
  })

  describe("clearAll", () => {
    it("clears all rate limits", () => {
      // Multiple users send emails
      rateLimiter.canSendEmail("user1")
      rateLimiter.canSendEmail("user2")
      rateLimiter.canSendEmail("user3")

      // Clear all
      rateLimiter.clearAll()

      // All users have zero count
      expect(rateLimiter.getCurrentCount("user1").count).toBe(0)
      expect(rateLimiter.getCurrentCount("user2").count).toBe(0)
      expect(rateLimiter.getCurrentCount("user3").count).toBe(0)
    })
  })

  describe("cleanupExpiredEntries", () => {
    it.skip("removes expired entries", () => {
      // TODO: Implement with proper time mocking
    })

    it.skip("does not remove non-expired entries", () => {
      // TODO: Implement with proper time mocking
    })

    it.skip("returns correct count of cleaned entries", () => {
      // TODO: Implement with proper time mocking
    })
  })

  describe("custom configuration", () => {
    it("respects custom max emails per hour", () => {
      const customLimiter = new EmailRateLimiter(5, 3600000)
      const userId = "user1"

      // Can send 5 emails
      for (let i = 0; i < 5; i++) {
        expect(customLimiter.canSendEmail(userId)).toBe(true)
      }

      // 6th email blocked
      expect(customLimiter.canSendEmail(userId)).toBe(false)
    })

    it.skip("respects custom window duration", () => {
      // TODO: Implement with proper time mocking
    })
  })
})
