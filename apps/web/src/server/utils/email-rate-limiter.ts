/**
 * Email Rate Limiter
 * Story 8.2: Prevents email spam by limiting immediate emails to 10 per hour per user
 */

interface RateLimitEntry {
  count: number
  resetAt: Date
}

export class EmailRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private readonly maxEmailsPerHour: number
  private readonly windowMs: number

  constructor(maxEmailsPerHour = 10, windowMs = 3600000) {
    this.maxEmailsPerHour = maxEmailsPerHour
    this.windowMs = windowMs // 1 hour in milliseconds
  }

  /**
   * Check if user can send an email
   * Large expense emails bypass rate limiting
   *
   * @param userId - User ID to check
   * @param isLargeExpense - Whether this is a large expense notification (bypasses limit)
   * @returns true if email can be sent, false if rate limit exceeded
   */
  canSendEmail(userId: string, isLargeExpense = false): boolean {
    // Large expense emails always bypass rate limiting (critical notifications)
    if (isLargeExpense) {
      return true
    }

    const now = new Date()
    const limit = this.limits.get(userId)

    // No limit exists or limit expired - create new entry
    if (!limit || now > limit.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: new Date(now.getTime() + this.windowMs),
      })
      return true
    }

    // Check if limit exceeded
    if (limit.count >= this.maxEmailsPerHour) {
      return false
    }

    // Increment count
    limit.count++
    return true
  }

  /**
   * Get current email count for a user
   *
   * @param userId - User ID to check
   * @returns Current email count and reset time
   */
  getCurrentCount(userId: string): { count: number; resetAt: Date | null } {
    const limit = this.limits.get(userId)
    const now = new Date()

    // No limit or expired
    if (!limit || now > limit.resetAt) {
      return { count: 0, resetAt: null }
    }

    return { count: limit.count, resetAt: limit.resetAt }
  }

  /**
   * Reset rate limit for a user (for testing purposes)
   *
   * @param userId - User ID to reset
   */
  reset(userId: string): void {
    this.limits.delete(userId)
  }

  /**
   * Clear all rate limits (for testing purposes)
   */
  clearAll(): void {
    this.limits.clear()
  }

  /**
   * Clean up expired entries (optional periodic cleanup)
   * Should be called periodically to prevent memory leaks
   */
  cleanupExpiredEntries(): number {
    const now = new Date()
    let cleaned = 0

    for (const [userId, limit] of this.limits.entries()) {
      if (now > limit.resetAt) {
        this.limits.delete(userId)
        cleaned++
      }
    }

    return cleaned
  }
}

// Singleton instance for application-wide rate limiting
export const emailRateLimiter = new EmailRateLimiter()
