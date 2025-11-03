/**
 * Notification Preferences Router Tests
 * Story 8.2: Email Notifications with User Preferences
 *
 * Tests for getPreferences, updatePreferences, and unsubscribeWithToken procedures
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { eq } from "drizzle-orm"
import { notificationPreferences } from "@/server/db/schema/notification_preferences"
import { revokedTokens } from "@/server/db/schema/revoked_tokens"
import { appRouter } from "../../root"
import { createTestContext, createTestDb } from "@/test/test-db"
import { generateToken, TokenExpiry } from "@/server/utils/jwt"

describe("notificationPreferences.getPreferences", () => {
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })
  it("should create default preferences if none exist", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    const preferences = await caller.notificationPreferences.getPreferences()

    expect(preferences).toMatchObject({
      userId: ctx.user.id,
      emailOnCost: true,
      emailOnLargeExpense: true,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: true,
      emailDigestFrequency: "immediate",
      timezone: "Australia/Sydney",
    })
  })

  it("should return existing preferences without creating duplicates", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create preferences first
    await ctx.db.insert(notificationPreferences).values({
      userId: ctx.user.id,
      emailOnCost: false,
      emailOnLargeExpense: false,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: false,
      emailDigestFrequency: "daily",
      timezone: "America/New_York",
    })

    const preferences = await caller.notificationPreferences.getPreferences()

    expect(preferences.emailOnCost).toBe(false)
    expect(preferences.emailOnLargeExpense).toBe(false)
    expect(preferences.emailDigestFrequency).toBe("daily")
    expect(preferences.timezone).toBe("America/New_York")

    // Verify only one record exists
    const allPreferences = await ctx.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, ctx.user.id))

    expect(allPreferences).toHaveLength(1)
  })

  it("should only return preferences for the authenticated user", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create a different user first
    const { users } = await import("@/server/db/schema")
    await ctx.db.insert(users).values({
      id: "different-user-id",
      email: "different@example.com",
      name: "Different User",
      firstName: "Different",
      lastName: "User",
      role: "partner",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create preferences for a different user
    await ctx.db.insert(notificationPreferences).values({
      userId: "different-user-id",
      emailOnCost: false,
      emailOnLargeExpense: false,
      emailOnDocument: false,
      emailOnTimeline: false,
      emailOnComment: false,
      emailDigestFrequency: "never",
      timezone: "Europe/London",
    })

    const preferences = await caller.notificationPreferences.getPreferences()

    // Should get default preferences for authenticated user, not the other user's preferences
    expect(preferences.userId).toBe(ctx.user.id)
    expect(preferences.emailOnCost).toBe(true) // Default value
    expect(preferences.emailDigestFrequency).toBe("immediate") // Default value
  })
})

describe("notificationPreferences.updatePreferences", () => {
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })
  it("should update existing preferences", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create initial preferences
    await ctx.db.insert(notificationPreferences).values({
      userId: ctx.user.id,
      emailOnCost: true,
      emailOnLargeExpense: true,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: true,
      emailDigestFrequency: "immediate",
      timezone: "Australia/Sydney",
    })

    const updated = await caller.notificationPreferences.updatePreferences({
      emailOnCost: false,
      emailDigestFrequency: "daily",
      timezone: "America/New_York",
    })

    expect(updated.emailOnCost).toBe(false)
    expect(updated.emailDigestFrequency).toBe("daily")
    expect(updated.timezone).toBe("America/New_York")
    // Unchanged fields should remain the same
    expect(updated.emailOnLargeExpense).toBe(true)
    expect(updated.emailOnDocument).toBe(true)
  })

  it("should create preferences if they don't exist (upsert)", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // No preferences exist yet
    const result = await caller.notificationPreferences.updatePreferences({
      emailOnCost: false,
      emailDigestFrequency: "weekly",
    })

    expect(result.userId).toBe(ctx.user.id)
    expect(result.emailOnCost).toBe(false)
    expect(result.emailDigestFrequency).toBe("weekly")
  })

  it("should update updatedAt timestamp", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create initial preferences
    await ctx.db.insert(notificationPreferences).values({
      userId: ctx.user.id,
      emailOnCost: true,
      emailOnLargeExpense: true,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: true,
      emailDigestFrequency: "immediate",
      timezone: "Australia/Sydney",
    })

    const before = await caller.notificationPreferences.getPreferences()
    const beforeTime = before.updatedAt.getTime()

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100))

    await caller.notificationPreferences.updatePreferences({
      emailOnCost: false,
    })

    const after = await caller.notificationPreferences.getPreferences()
    const afterTime = after.updatedAt.getTime()

    expect(afterTime).toBeGreaterThan(beforeTime)
  })

  it("should validate digest frequency enum", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    await expect(
      // @ts-expect-error - Testing invalid enum value
      caller.notificationPreferences.updatePreferences({
        emailDigestFrequency: "invalid",
      })
    ).rejects.toThrow()
  })

  it("should only update preferences for the authenticated user (RBAC)", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create a different user first
    const { users } = await import("@/server/db/schema")
    await ctx.db.insert(users).values({
      id: "different-user-id",
      email: "different@example.com",
      name: "Different User",
      firstName: "Different",
      lastName: "User",
      role: "partner",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create preferences for a different user
    await ctx.db.insert(notificationPreferences).values({
      userId: "different-user-id",
      emailOnCost: true,
      emailOnLargeExpense: true,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: true,
      emailDigestFrequency: "immediate",
      timezone: "Australia/Sydney",
    })

    // Update preferences for authenticated user
    await caller.notificationPreferences.updatePreferences({
      emailOnCost: false,
    })

    // Check that other user's preferences are unchanged
    const otherUserPreferences = await ctx.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, "different-user-id"))

    expect(otherUserPreferences[0].emailOnCost).toBe(true) // Unchanged
  })
})

describe("notificationPreferences.unsubscribeWithToken", () => {
  let cleanup: () => Promise<void>

  beforeEach(async () => {
    const testDb = await createTestDb()
    cleanup = testDb.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })
  it(
    "should unsubscribe user with valid token",
    async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create preferences
      await ctx.db.insert(notificationPreferences).values({
        userId: ctx.user.id,
        emailOnCost: true,
        emailOnLargeExpense: true,
        emailOnDocument: true,
        emailOnTimeline: true,
        emailOnComment: true,
        emailDigestFrequency: "immediate",
        timezone: "Australia/Sydney",
      })

      // Generate unsubscribe token
      const { token, jti } = await generateToken(
        { userId: ctx.user.id, purpose: "unsubscribe" },
        TokenExpiry.UNSUBSCRIBE
      )

      const result = await caller.notificationPreferences.unsubscribeWithToken({ token })

      expect(result.success).toBe(true)
      expect(result.message).toContain("unsubscribed")

      // Verify preferences updated
      const preferences = await caller.notificationPreferences.getPreferences()
      expect(preferences.emailDigestFrequency).toBe("never")

      // Verify token was revoked
      const revokedToken = await ctx.db
        .select()
        .from(revokedTokens)
        .where(eq(revokedTokens.jti, jti))

      expect(revokedToken).toHaveLength(1)
      expect(revokedToken[0].purpose).toBe("unsubscribe")
      expect(revokedToken[0].reason).toBe("User unsubscribed via email link")
    },
    { timeout: 15000 }
  )

  it("should reject invalid token", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    await expect(
      caller.notificationPreferences.unsubscribeWithToken({ token: "invalid-token" })
    ).rejects.toThrow()
  })

  it("should reject expired token", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Generate token with very short expiry
    const { token } = await generateToken(
      { userId: ctx.user.id, purpose: "unsubscribe" },
      1 // 1 millisecond
    )

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10))

    await expect(caller.notificationPreferences.unsubscribeWithToken({ token })).rejects.toThrow()
  })

  it(
    "should reject already revoked token",
    async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Create preferences
      await ctx.db.insert(notificationPreferences).values({
        userId: ctx.user.id,
        emailOnCost: true,
        emailOnLargeExpense: true,
        emailOnDocument: true,
        emailOnTimeline: true,
        emailOnComment: true,
        emailDigestFrequency: "immediate",
        timezone: "Australia/Sydney",
      })

      // Generate token
      const { token } = await generateToken(
        { userId: ctx.user.id, purpose: "unsubscribe" },
        TokenExpiry.UNSUBSCRIBE
      )

      // First unsubscribe should succeed
      const result1 = await caller.notificationPreferences.unsubscribeWithToken({ token })
      expect(result1.success).toBe(true)

      // Second unsubscribe with same token should fail
      await expect(caller.notificationPreferences.unsubscribeWithToken({ token })).rejects.toThrow()
    },
    { timeout: 15000 }
  )

  it("should reject token with wrong purpose", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Generate token with different purpose
    const { token } = await generateToken(
      { userId: ctx.user.id, purpose: "password_reset" },
      TokenExpiry.PASSWORD_RESET
    )

    await expect(caller.notificationPreferences.unsubscribeWithToken({ token })).rejects.toThrow()
  })

  it("should only unsubscribe the token's user (RBAC)", async () => {
    const ctx = await createTestContext()
    const caller = appRouter.createCaller(ctx)

    // Create a different user first
    const { users } = await import("@/server/db/schema")
    await ctx.db.insert(users).values({
      id: "different-user-id",
      email: "different@example.com",
      name: "Different User",
      firstName: "Different",
      lastName: "User",
      role: "partner",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create preferences for a different user
    await ctx.db.insert(notificationPreferences).values({
      userId: "different-user-id",
      emailOnCost: true,
      emailOnLargeExpense: true,
      emailOnDocument: true,
      emailOnTimeline: true,
      emailOnComment: true,
      emailDigestFrequency: "immediate",
      timezone: "Australia/Sydney",
    })

    // Generate token for different user
    const { token } = await generateToken(
      { userId: "different-user-id", purpose: "unsubscribe" },
      TokenExpiry.UNSUBSCRIBE
    )

    // Authenticated user should not be able to unsubscribe other user
    await expect(caller.notificationPreferences.unsubscribeWithToken({ token })).rejects.toThrow()
  })
})
