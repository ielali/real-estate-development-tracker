/**
 * Rate limiter with backup type support
 * Tracks rate limits separately for JSON and ZIP backups
 */

interface RateLimitEntry {
  count: number
  resetAt: number // Unix timestamp (ms)
}

interface TypedRateLimitEntry {
  json: RateLimitEntry | null
  zip: RateLimitEntry | null
}

export type BackupType = "json" | "zip"

export class TypedRateLimiter {
  private limits = new Map<string, TypedRateLimitEntry>()

  /**
   * Check if a user can make a backup request of the given type
   * @param userId - User ID making the request
   * @param backupType - Type of backup ('json' or 'zip')
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @param windowMs - Time window in milliseconds (default: 1 hour)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(userId: string, backupType: BackupType, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    let userEntry = this.limits.get(userId)

    // Initialize user entry if doesn't exist
    if (!userEntry) {
      userEntry = { json: null, zip: null }
      this.limits.set(userId, userEntry)
    }

    const entry = userEntry[backupType]

    // No entry or expired window - allow and create new entry
    if (!entry || now > entry.resetAt) {
      userEntry[backupType] = {
        count: 1,
        resetAt: now + windowMs,
      }
      return true
    }

    // Within window, check count
    if (entry.count < maxRequests) {
      entry.count++
      return true
    }

    return false // Limit exceeded
  }

  /**
   * Get the time until the rate limit resets for a user and backup type
   * @param userId - User ID
   * @param backupType - Type of backup ('json' or 'zip')
   * @returns Time in milliseconds until reset, or 0 if no limit active
   */
  getTimeUntilReset(userId: string, backupType: BackupType): number {
    const userEntry = this.limits.get(userId)
    if (!userEntry) return 0

    const entry = userEntry[backupType]
    if (!entry) return 0

    return Math.max(0, entry.resetAt - Date.now())
  }

  /**
   * Get the current request count for a user and backup type
   * @param userId - User ID
   * @param backupType - Type of backup ('json' or 'zip')
   * @returns Current count, or 0 if no entry exists
   */
  getCount(userId: string, backupType: BackupType): number {
    const userEntry = this.limits.get(userId)
    if (!userEntry) return 0

    const entry = userEntry[backupType]
    if (!entry) return 0

    // Check if expired
    if (Date.now() > entry.resetAt) return 0

    return entry.count
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  clear(): void {
    this.limits.clear()
  }

  /**
   * Clear rate limit entry for a specific user (useful for testing)
   */
  clearUser(userId: string): void {
    this.limits.delete(userId)
  }
}

// Singleton instance for use across the application
export const backupRateLimiter = new TypedRateLimiter()

// Rate limit constants
export const RATE_LIMITS = {
  JSON: {
    MAX_REQUESTS: 5,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
  ZIP: {
    MAX_REQUESTS: 2,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
} as const
