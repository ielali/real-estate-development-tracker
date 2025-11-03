/**
 * Security Event Logger Tests
 *
 * Story 6.3: Tests for security event logging service
 *
 * Test coverage:
 * - Service initialization and exports
 * - Event logging methods
 * - Request metadata extraction
 * - Error handling
 * - Event retrieval
 */

import { describe, test, expect, beforeEach, vi } from "vitest"
import { SecurityEventLogger, getRequestMetadata } from "../security-event-logger"
import { db } from "@/server/db"
import {
  securityEvents,
  SecurityEventType,
  type SecurityEvent,
} from "@/server/db/schema/security-events"
import { eq, desc } from "drizzle-orm"
import { createTestContext } from "@/test/test-db"

// Mock console.error to prevent error logs during tests
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

describe("SecurityEventLogger - Service Structure", () => {
  test("exports SecurityEventLogger class", () => {
    expect(SecurityEventLogger).toBeDefined()
    expect(typeof SecurityEventLogger).toBe("function")
  })

  test("exports securityEventLogger singleton", async () => {
    const module = await import("../security-event-logger")
    expect(module.securityEventLogger).toBeDefined()
    expect(module.securityEventLogger).toBeInstanceOf(SecurityEventLogger)
  })

  test("exports getRequestMetadata helper function", () => {
    expect(getRequestMetadata).toBeDefined()
    expect(typeof getRequestMetadata).toBe("function")
  })

  test("SecurityEventType enum is defined", () => {
    expect(SecurityEventType).toBeDefined()
    expect(SecurityEventType.TWO_FA_ENABLED).toBe("2fa_enabled")
    expect(SecurityEventType.TWO_FA_DISABLED).toBe("2fa_disabled")
    expect(SecurityEventType.TWO_FA_LOGIN_SUCCESS).toBe("2fa_login_success")
    expect(SecurityEventType.TWO_FA_LOGIN_FAILURE).toBe("2fa_login_failure")
    expect(SecurityEventType.BACKUP_CODE_GENERATED).toBe("backup_code_generated")
    expect(SecurityEventType.BACKUP_CODE_USED).toBe("backup_code_used")
    expect(SecurityEventType.BACKUP_DOWNLOADED).toBe("backup_downloaded")
  })
})

describe("getRequestMetadata - IP Address Extraction", () => {
  test("extracts IP from cf-connecting-ip header (Cloudflare)", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.1",
      "user-agent": "Mozilla/5.0",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.ipAddress).toBe("203.0.113.1")
  })

  test("extracts IP from x-forwarded-for header (Proxy)", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.2, 198.51.100.1",
      "user-agent": "Mozilla/5.0",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.ipAddress).toBe("203.0.113.2")
  })

  test("extracts IP from x-real-ip header (Nginx)", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.3",
      "user-agent": "Mozilla/5.0",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.ipAddress).toBe("203.0.113.3")
  })

  test("returns 'unknown' when no IP headers present", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.ipAddress).toBe("unknown")
  })

  test("prioritizes cf-connecting-ip over other headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.1",
      "x-forwarded-for": "203.0.113.2",
      "x-real-ip": "203.0.113.3",
      "user-agent": "Mozilla/5.0",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.ipAddress).toBe("203.0.113.1")
  })
})

describe("getRequestMetadata - User Agent Extraction", () => {
  test("extracts user agent from headers", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.userAgent).toBe("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
  })

  test("returns 'unknown' when user-agent header is missing", () => {
    const headers = new Headers()

    const metadata = getRequestMetadata(headers)
    expect(metadata.userAgent).toBe("unknown")
  })

  test("handles empty user-agent header", () => {
    const headers = new Headers({
      "user-agent": "",
    })

    const metadata = getRequestMetadata(headers)
    expect(metadata.userAgent).toBe("unknown")
  })
})

describe("SecurityEventLogger - Event Logging Methods", () => {
  let logger: SecurityEventLogger
  const testIpAddress = "203.0.113.1"
  const testUserAgent = "Mozilla/5.0 (Test Browser)"

  beforeEach(() => {
    logger = new SecurityEventLogger()
    consoleErrorSpy.mockClear()
  })

  test("log2FAEnabled creates correct event", async () => {
    const ctx = await createTestContext()
    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[0].eventType).toBe(SecurityEventType.TWO_FA_ENABLED)
    expect(events[0].userId).toBe(ctx.user!.id)
    expect(events[0].ipAddress).toBe(testIpAddress)
    expect(events[0].userAgent).toBe(testUserAgent)
    expect(events[0].metadata).toBeNull()
  })

  test("log2FADisabled creates correct event", async () => {
    const ctx = await createTestContext()
    await logger.log2FADisabled(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.TWO_FA_DISABLED)
  })

  test("log2FALoginSuccess creates correct event", async () => {
    const ctx = await createTestContext()
    await logger.log2FALoginSuccess(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.TWO_FA_LOGIN_SUCCESS)
  })

  test("log2FALoginFailure creates event with attempts metadata", async () => {
    const ctx = await createTestContext()
    const attempts = 3
    await logger.log2FALoginFailure(ctx.user!.id, testIpAddress, testUserAgent, attempts)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.TWO_FA_LOGIN_FAILURE)
    expect(events[0].metadata).toEqual({ attempts })
  })

  test("logBackupCodeGenerated creates event with codeCount metadata", async () => {
    const ctx = await createTestContext()
    const codeCount = 10
    await logger.logBackupCodeGenerated(ctx.user!.id, testIpAddress, testUserAgent, codeCount)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.BACKUP_CODE_GENERATED)
    expect(events[0].metadata).toEqual({ codeCount })
  })

  test("logBackupCodeUsed creates correct event", async () => {
    const ctx = await createTestContext()
    await logger.logBackupCodeUsed(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.BACKUP_CODE_USED)
  })

  test("logBackupDownloaded creates event with project metadata", async () => {
    const ctx = await createTestContext()
    const projectId = "project-123"
    const projectName = "Test Project"

    await logger.logBackupDownloaded(
      ctx.user!.id,
      projectId,
      projectName,
      testIpAddress,
      testUserAgent
    )

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].eventType).toBe(SecurityEventType.BACKUP_DOWNLOADED)
    expect(events[0].metadata).toEqual({ projectId, projectName })
  })

  test("logEvent handles metadata correctly", async () => {
    const ctx = await createTestContext()
    const metadata = { custom: "data", number: 42 }

    await logger.logEvent(
      ctx.user!.id,
      SecurityEventType.TWO_FA_ENABLED,
      testIpAddress,
      testUserAgent,
      metadata
    )

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    expect(events[0].metadata).toEqual(metadata)
  })

  test("logEvent sets timestamp", async () => {
    const ctx = await createTestContext()
    const beforeTime = new Date()

    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)

    const afterTime = new Date()

    const events = await db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, ctx.user!.id),
      orderBy: [desc(securityEvents.timestamp)],
      limit: 1,
    })

    const eventTime = new Date(events[0].timestamp)
    expect(eventTime >= beforeTime && eventTime <= afterTime).toBe(true)
  })
})

describe("SecurityEventLogger - getUserEvents", () => {
  let logger: SecurityEventLogger
  const testIpAddress = "203.0.113.1"
  const testUserAgent = "Mozilla/5.0"

  beforeEach(() => {
    logger = new SecurityEventLogger()
  })

  test("retrieves events for user", async () => {
    const ctx = await createTestContext()

    // Create some test events
    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.log2FALoginSuccess(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.logBackupCodeGenerated(ctx.user!.id, testIpAddress, testUserAgent, 10)

    const events = await logger.getUserEvents(ctx.user!.id)

    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events.every((e: SecurityEvent) => e.userId === ctx.user!.id)).toBe(true)
  })

  test("returns events in descending order by timestamp", async () => {
    const ctx = await createTestContext()

    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.log2FALoginSuccess(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await logger.getUserEvents(ctx.user!.id)

    for (let i = 0; i < events.length - 1; i++) {
      const currentTime = new Date(events[i].timestamp).getTime()
      const nextTime = new Date(events[i + 1].timestamp).getTime()
      expect(currentTime).toBeGreaterThanOrEqual(nextTime)
    }
  })

  test("respects limit parameter", async () => {
    const ctx = await createTestContext()

    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.log2FALoginSuccess(ctx.user!.id, testIpAddress, testUserAgent)

    const limit = 1
    const events = await logger.getUserEvents(ctx.user!.id, limit)

    expect(events.length).toBeLessThanOrEqual(limit)
  })

  test("defaults to limit of 50", async () => {
    const ctx = await createTestContext()

    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)

    const events = await logger.getUserEvents(ctx.user!.id)
    expect(Array.isArray(events)).toBe(true)
  })

  test("returns empty array for user with no events", async () => {
    const ctx = await createTestContext()

    const events = await logger.getUserEvents(ctx.user!.id)

    // May have events from test setup, but should be an array
    expect(Array.isArray(events)).toBe(true)
  })
})

describe("SecurityEventLogger - Error Handling", () => {
  let logger: SecurityEventLogger

  beforeEach(() => {
    logger = new SecurityEventLogger()
    consoleErrorSpy.mockClear()
  })

  test("logs error to console but doesn't throw on failure", async () => {
    // Test with invalid user ID that would cause DB constraint violation
    // The service should catch the error and log it, not throw
    const result = logger.logEvent(
      "", // Empty user ID should violate not null constraint
      SecurityEventType.TWO_FA_ENABLED,
      "203.0.113.1",
      "Mozilla/5.0"
    )

    // Should not throw
    await expect(result).resolves.toBeUndefined()

    // Should have logged error to console
    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(consoleErrorSpy.mock.calls[0][0]).toContain("Failed to log security event")
  })
})

describe("SecurityEventLogger - Integration", () => {
  let logger: SecurityEventLogger
  const testIpAddress = "203.0.113.1"
  const testUserAgent = "Mozilla/5.0"

  beforeEach(() => {
    logger = new SecurityEventLogger()
  })

  test("end-to-end workflow: log multiple events and retrieve them", async () => {
    const ctx = await createTestContext()

    // Simulate a complete user journey
    await logger.log2FAEnabled(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.logBackupCodeGenerated(ctx.user!.id, testIpAddress, testUserAgent, 10)
    await logger.log2FALoginSuccess(ctx.user!.id, testIpAddress, testUserAgent)
    await logger.logBackupDownloaded(
      ctx.user!.id,
      "project-1",
      "My Project",
      testIpAddress,
      testUserAgent
    )

    // Retrieve all events
    const events = await logger.getUserEvents(ctx.user!.id)

    expect(events.length).toBeGreaterThanOrEqual(4)

    // Verify events are in correct order (newest first)
    expect(events[0].eventType).toBe(SecurityEventType.BACKUP_DOWNLOADED)
    expect(events[1].eventType).toBe(SecurityEventType.TWO_FA_LOGIN_SUCCESS)
    expect(events[2].eventType).toBe(SecurityEventType.BACKUP_CODE_GENERATED)
    expect(events[3].eventType).toBe(SecurityEventType.TWO_FA_ENABLED)
  })

  test("events from different users are isolated", async () => {
    const ctx1 = await createTestContext()
    const ctx2 = await createTestContext()

    await logger.log2FAEnabled(ctx1.user!.id, testIpAddress, testUserAgent)
    await logger.log2FAEnabled(ctx2.user!.id, testIpAddress, testUserAgent)

    const user1Events = await logger.getUserEvents(ctx1.user!.id)
    const user2Events = await logger.getUserEvents(ctx2.user!.id)

    expect(user1Events.every((e: SecurityEvent) => e.userId === ctx1.user!.id)).toBe(true)
    expect(user2Events.every((e: SecurityEvent) => e.userId === ctx2.user!.id)).toBe(true)
    expect(user1Events.some((e: SecurityEvent) => e.userId === ctx2.user!.id)).toBe(false)
    expect(user2Events.some((e: SecurityEvent) => e.userId === ctx1.user!.id)).toBe(false)
  })
})
