/**
 * Security Event Logger Service
 *
 * Story 6.3: Logs security events for user activity tracking and monitoring
 *
 * Features:
 * - Logs all security events (2FA, backups, etc.)
 * - Extracts IP address and user agent from requests
 * - Stores event metadata in JSON format
 * - Query recent events for activity log display
 */

import { db } from "../db"
import { securityEvents, SecurityEventType } from "../db/schema/security-events"
import { desc, eq } from "drizzle-orm"

/**
 * Helper function to extract request metadata (IP address and user agent)
 * @param headers - Request headers object
 * @returns Object containing ipAddress and userAgent
 */
export function getRequestMetadata(headers: Headers): {
  ipAddress: string
  userAgent: string
} {
  // Extract IP address from headers (Cloudflare, Vercel, or standard headers)
  const ipAddress =
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || // Proxy chain
    headers.get("x-real-ip") || // Nginx
    "unknown"

  // Extract user agent
  const userAgent = headers.get("user-agent") || "unknown"

  return { ipAddress, userAgent }
}

/**
 * Security Event Logger Class
 * Provides methods for logging security events to the database
 */
export class SecurityEventLogger {
  /**
   * Generic method to log any security event
   * @param userId - User ID performing the action
   * @param eventType - Type of security event
   * @param ipAddress - IP address of the request
   * @param userAgent - User agent string from request
   * @param metadata - Optional additional event-specific data
   */
  async logEvent(
    userId: string,
    eventType: SecurityEventType,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<void> {
    try {
      await db.insert(securityEvents).values({
        userId,
        eventType,
        ipAddress,
        userAgent,
        metadata: metadata ? metadata : null,
        timestamp: new Date(),
      })
    } catch (error) {
      // Log to console but don't throw - security logging failures shouldn't break user flows
      console.error("Failed to log security event:", error)
    }
  }

  /**
   * Log when user enables 2FA
   */
  async log2FAEnabled(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logEvent(userId, SecurityEventType.TWO_FA_ENABLED, ipAddress, userAgent)
  }

  /**
   * Log when user disables 2FA
   */
  async log2FADisabled(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logEvent(userId, SecurityEventType.TWO_FA_DISABLED, ipAddress, userAgent)
  }

  /**
   * Log successful 2FA login
   */
  async log2FALoginSuccess(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logEvent(userId, SecurityEventType.TWO_FA_LOGIN_SUCCESS, ipAddress, userAgent)
  }

  /**
   * Log failed 2FA login attempt
   * @param attempts - Number of consecutive failed attempts
   */
  async log2FALoginFailure(
    userId: string,
    ipAddress: string,
    userAgent: string,
    attempts: number
  ): Promise<void> {
    await this.logEvent(userId, SecurityEventType.TWO_FA_LOGIN_FAILURE, ipAddress, userAgent, {
      attempts,
    })
  }

  /**
   * Log when backup codes are generated or regenerated
   * @param codeCount - Number of backup codes generated
   */
  async logBackupCodeGenerated(
    userId: string,
    ipAddress: string,
    userAgent: string,
    codeCount: number
  ): Promise<void> {
    await this.logEvent(userId, SecurityEventType.BACKUP_CODE_GENERATED, ipAddress, userAgent, {
      codeCount,
    })
  }

  /**
   * Log when a backup code is used for authentication
   */
  async logBackupCodeUsed(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    await this.logEvent(userId, SecurityEventType.BACKUP_CODE_USED, ipAddress, userAgent)
  }

  /**
   * Log when a project backup is downloaded
   * @param projectId - ID of the project being backed up
   * @param projectName - Name of the project for display
   */
  async logBackupDownloaded(
    userId: string,
    projectId: string,
    projectName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logEvent(userId, SecurityEventType.BACKUP_DOWNLOADED, ipAddress, userAgent, {
      projectId,
      projectName,
    })
  }

  /**
   * Get recent security events for a user
   * @param userId - User ID to query events for
   * @param limit - Maximum number of events to return (default: 50)
   * @returns Array of security events ordered by timestamp (newest first)
   */
  async getUserEvents(userId: string, limit: number = 50) {
    return await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, userId),
      orderBy: [desc(securityEvents.timestamp)],
      limit,
    })
  }
}

/**
 * Singleton instance for use across the application
 * Import this instance to log security events
 *
 * @example
 * import { securityEventLogger } from "@/server/services/security-event-logger"
 *
 * // In a tRPC procedure or server action:
 * const { ipAddress, userAgent } = getRequestMetadata(ctx.headers)
 * await securityEventLogger.log2FAEnabled(userId, ipAddress, userAgent)
 */
export const securityEventLogger = new SecurityEventLogger()
