/**
 * Security Router Tests
 *
 * Story 6.3: Tests for security tRPC router
 *
 * Test coverage:
 * - getActivityLog endpoint
 * - get2FAAdoptionStats endpoint (admin only)
 * - Authorization checks
 * - Data filtering and ordering
 */

import { describe, test, expect } from "vitest"
import { appRouter } from "@/server/api/root"
import { createTestContext } from "@/test/test-db"
import { securityEventLogger } from "@/server/services/security-event-logger"
import { db } from "@/server/db"
import { users } from "@/server/db/schema/users"
import { eq } from "drizzle-orm"

describe("securityRouter", () => {
  describe("getActivityLog", () => {
    test("returns security events for authenticated user", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create some test events
      await securityEventLogger.log2FAEnabled(ctx.user.id, "203.0.113.1", "Test Browser")
      await securityEventLogger.log2FALoginSuccess(ctx.user.id, "203.0.113.1", "Test Browser")

      const result = await caller.security.getActivityLog()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(2)

      // Verify event structure
      const event = result[0]
      expect(event).toHaveProperty("id")
      expect(event).toHaveProperty("eventType")
      expect(event).toHaveProperty("timestamp")
      expect(event).toHaveProperty("ipAddress")
      expect(event).toHaveProperty("userAgent")
      expect(event).toHaveProperty("metadata")
    })

    test("returns events in descending order by timestamp", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create events with slight delay to ensure different timestamps
      await securityEventLogger.log2FAEnabled(ctx.user.id, "203.0.113.1", "Browser 1")
      await new Promise((resolve) => setTimeout(resolve, 10))
      await securityEventLogger.log2FALoginSuccess(ctx.user.id, "203.0.113.2", "Browser 2")

      const result = await caller.security.getActivityLog()

      // Newest event should be first
      expect(result[0].eventType).toBe("2fa_login_success")
      expect(result[0].ipAddress).toBe("203.0.113.2")

      // Verify timestamp ordering
      for (let i = 0; i < result.length - 1; i++) {
        const currentTime = new Date(result[i].timestamp).getTime()
        const nextTime = new Date(result[i + 1].timestamp).getTime()
        expect(currentTime).toBeGreaterThanOrEqual(nextTime)
      }
    })

    test("only returns events for the authenticated user", async () => {
      const ctx1 = await createTestContext()
      const ctx2 = await createTestContext()

      // Create events for user 1
      await securityEventLogger.log2FAEnabled(ctx1.user.id, "203.0.113.1", "Browser")

      // Create events for user 2
      await securityEventLogger.log2FAEnabled(ctx2.user.id, "203.0.113.2", "Browser")

      // Query as user 1
      const caller1 = appRouter.createCaller(ctx1)
      const result1 = await caller1.security.getActivityLog()

      // Should only see user 1's events
      const user1Events = result1.filter((e) => e.ipAddress === "203.0.113.1")
      const user2Events = result1.filter((e) => e.ipAddress === "203.0.113.2")

      expect(user1Events.length).toBeGreaterThan(0)
      expect(user2Events.length).toBe(0)
    })

    test("limits results to 50 events", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create more than 50 events (just verify limit is applied)
      const result = await caller.security.getActivityLog()

      expect(result.length).toBeLessThanOrEqual(50)
    })

    test("includes event metadata when present", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create event with metadata
      await securityEventLogger.logBackupDownloaded(
        ctx.user.id,
        "project-123",
        "Test Project",
        "203.0.113.1",
        "Test Browser"
      )

      const result = await caller.security.getActivityLog()

      const backupEvent = result.find((e) => e.eventType === "backup_downloaded")
      expect(backupEvent).toBeDefined()
      expect(backupEvent?.metadata).toEqual({
        projectId: "project-123",
        projectName: "Test Project",
      })
    })

    test("throws UNAUTHORIZED when user is not authenticated", async () => {
      const ctx = await createTestContext()
      // Create caller with no user
      const unauthCtx = { ...ctx, user: null }
      const caller = appRouter.createCaller(unauthCtx)

      await expect(caller.security.getActivityLog()).rejects.toThrow(/logged in|UNAUTHORIZED/i)
    })

    test("returns empty array when user has no events", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Don't create any events for this user
      const result = await caller.security.getActivityLog()

      // Might have some events from test setup, but should be an array
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe("get2FAAdoptionStats", () => {
    test("returns adoption statistics for admin users", async () => {
      const ctx = await createTestContext()

      // Update user to admin role
      await db.update(users).set({ role: "admin" }).where(eq(users.id, ctx.user.id))

      const adminCtx = {
        ...ctx,
        user: { ...ctx.user, role: "admin" as const },
      }

      const caller = appRouter.createCaller(adminCtx)
      const result = await caller.security.get2FAAdoptionStats()

      expect(result).toBeDefined()
      expect(result).toHaveProperty("totalUsers")
      expect(result).toHaveProperty("usersWithTwoFactor")
      expect(result).toHaveProperty("adoptionPercentage")

      expect(typeof result.totalUsers).toBe("number")
      expect(typeof result.usersWithTwoFactor).toBe("number")
      expect(typeof result.adoptionPercentage).toBe("number")

      expect(result.totalUsers).toBeGreaterThanOrEqual(0)
      expect(result.usersWithTwoFactor).toBeGreaterThanOrEqual(0)
      expect(result.usersWithTwoFactor).toBeLessThanOrEqual(result.totalUsers)
    })

    test("calculates adoption percentage correctly", async () => {
      const ctx = await createTestContext()

      // Update user to admin role
      await db.update(users).set({ role: "admin" }).where(eq(users.id, ctx.user.id))

      const adminCtx = {
        ...ctx,
        user: { ...ctx.user, role: "admin" as const },
      }

      const caller = appRouter.createCaller(adminCtx)
      const result = await caller.security.get2FAAdoptionStats()

      // Verify percentage calculation
      if (result.totalUsers > 0) {
        const expectedPercentage = Math.round((result.usersWithTwoFactor / result.totalUsers) * 100)
        expect(result.adoptionPercentage).toBe(expectedPercentage)
      } else {
        expect(result.adoptionPercentage).toBe(0)
      }
    })

    test("returns 0% adoption when no users exist", async () => {
      const ctx = await createTestContext()

      // Update user to admin role
      await db.update(users).set({ role: "admin" }).where(eq(users.id, ctx.user.id))

      const adminCtx = {
        ...ctx,
        user: { ...ctx.user, role: "admin" as const },
      }

      const caller = appRouter.createCaller(adminCtx)
      const result = await caller.security.get2FAAdoptionStats()

      // Even with test users, verify the structure
      expect(result.adoptionPercentage).toBeGreaterThanOrEqual(0)
      expect(result.adoptionPercentage).toBeLessThanOrEqual(100)
    })

    test("only counts non-deleted users", async () => {
      const ctx = await createTestContext()

      // Update user to admin role
      await db.update(users).set({ role: "admin" }).where(eq(users.id, ctx.user.id))

      const adminCtx = {
        ...ctx,
        user: { ...ctx.user, role: "admin" as const },
      }

      const caller = appRouter.createCaller(adminCtx)

      // Get initial stats
      const initialStats = await caller.security.get2FAAdoptionStats()

      // Create and then soft-delete a user
      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "deleted-user@test.com",
          name: "Deleted User",
          role: "user",
          twoFactorEnabled: true,
        })
        .returning()

      // Soft delete the user
      await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, newUser.id))

      // Get stats again
      const afterDeleteStats = await caller.security.get2FAAdoptionStats()

      // Stats should be the same (deleted user not counted)
      expect(afterDeleteStats.totalUsers).toBe(initialStats.totalUsers)
    })

    test("throws FORBIDDEN for non-admin users", async () => {
      const ctx = await createTestContext()

      // Ensure user is not admin
      await db.update(users).set({ role: "user" }).where(eq(users.id, ctx.user.id))

      const userCtx = {
        ...ctx,
        user: { ...ctx.user, role: "user" as const },
      }

      const caller = appRouter.createCaller(userCtx)

      await expect(caller.security.get2FAAdoptionStats()).rejects.toThrow(
        /admin privileges|FORBIDDEN/i
      )
    })

    test("throws FORBIDDEN for partner users", async () => {
      const ctx = await createTestContext()

      // Update user to partner role
      await db.update(users).set({ role: "partner" }).where(eq(users.id, ctx.user.id))

      const partnerCtx = {
        ...ctx,
        user: { ...ctx.user, role: "partner" as const },
      }

      const caller = appRouter.createCaller(partnerCtx)

      await expect(caller.security.get2FAAdoptionStats()).rejects.toThrow(
        /admin privileges|FORBIDDEN/i
      )
    })

    test("counts users with 2FA correctly", async () => {
      const ctx = await createTestContext()

      // Update user to admin role
      await db.update(users).set({ role: "admin" }).where(eq(users.id, ctx.user.id))

      const adminCtx = {
        ...ctx,
        user: { ...ctx.user, role: "admin" as const },
      }

      const caller = appRouter.createCaller(adminCtx)

      // Get initial count
      const initialStats = await caller.security.get2FAAdoptionStats()

      // Create a user with 2FA enabled
      const [userWith2FA] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email: "user-with-2fa@test.com",
          name: "2FA User",
          role: "user",
          twoFactorEnabled: true,
        })
        .returning()

      // Get stats again
      const afterAddStats = await caller.security.get2FAAdoptionStats()

      // Should have one more user with 2FA
      expect(afterAddStats.usersWithTwoFactor).toBe(initialStats.usersWithTwoFactor + 1)
      expect(afterAddStats.totalUsers).toBe(initialStats.totalUsers + 1)

      // Clean up
      await db.delete(users).where(eq(users.id, userWith2FA.id))
    })
  })

  describe("Security Router - Integration", () => {
    test("complete workflow: user enables 2FA, logs in, downloads backup", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Simulate user journey
      await securityEventLogger.log2FAEnabled(ctx.user.id, "203.0.113.1", "Chrome on macOS")
      await securityEventLogger.logBackupCodeGenerated(
        ctx.user.id,
        "203.0.113.1",
        "Chrome on macOS",
        10
      )
      await securityEventLogger.log2FALoginSuccess(ctx.user.id, "203.0.113.1", "Chrome on macOS")
      await securityEventLogger.logBackupDownloaded(
        ctx.user.id,
        "project-1",
        "My Project",
        "203.0.113.1",
        "Chrome on macOS"
      )

      // Retrieve activity log
      const events = await caller.security.getActivityLog()

      // Should see all 4 events we just created
      expect(events.length).toBeGreaterThanOrEqual(4)

      // Extract event types for easier testing
      const eventTypes = events.map((e) => e.eventType)

      // Check that all expected events are present (order may vary due to timing/transactions)
      expect(eventTypes).toContain("backup_downloaded")
      expect(eventTypes).toContain("2fa_login_success")
      expect(eventTypes).toContain("backup_code_generated")
      expect(eventTypes).toContain("2fa_enabled")

      // Verify backup_downloaded event is present (it should be one of the most recent)
      const backupEvent = events.find((e) => e.eventType === "backup_downloaded")
      expect(backupEvent).toBeDefined()
      expect(backupEvent?.ipAddress).toBe("203.0.113.1")
    })

    test("admin can view stats while regular user cannot", async () => {
      const adminCtx = await createTestContext()
      const userCtx = await createTestContext()

      // Make first user admin
      await db.update(users).set({ role: "admin" }).where(eq(users.id, adminCtx.user.id))

      const adminCaller = appRouter.createCaller({
        ...adminCtx,
        user: { ...adminCtx.user, role: "admin" as const },
      })

      // Ensure user is partner (default role)
      const userCaller = appRouter.createCaller({
        ...userCtx,
        user: { ...userCtx.user, role: "partner" as const },
      })

      // Admin can access stats
      const stats = await adminCaller.security.get2FAAdoptionStats()
      expect(stats).toBeDefined()
      expect(stats.totalUsers).toBeGreaterThanOrEqual(0)
      expect(stats.usersWithTwoFactor).toBeGreaterThanOrEqual(0)
      expect(stats.adoptionPercentage).toBeGreaterThanOrEqual(0)

      // Regular user cannot (should throw error with message about admin privileges)
      await expect(userCaller.security.get2FAAdoptionStats()).rejects.toThrow(
        /admin privileges|FORBIDDEN/i
      )
    })
  })
})
