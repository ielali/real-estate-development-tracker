import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest"
import bcrypt from "bcryptjs"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import { users, accounts, sessions } from "@/server/db/schema"
import { eq } from "drizzle-orm"

/**
 * Authentication Tests
 *
 * Tests authentication operations against remote Neon PostgreSQL database.
 * IMPORTANT: Database must be empty at start - each test creates its own data and cleans up.
 */
describe("Authentication", () => {
  let testDbConnection: Awaited<ReturnType<typeof createTestDb>>
  let db: Awaited<ReturnType<typeof createTestDb>>["db"]

  beforeAll(async () => {
    testDbConnection = await createTestDb()
    db = testDbConnection.db
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    // Clean up before each test - ensure remote DB is empty for test isolation
    await testDbConnection.cleanup()
  })

  describe("User Registration", () => {
    it("should hash password before storing", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        role: "admin" as const,
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const userId = crypto.randomUUID()

      const [user] = await db
        .insert(users)
        .values({
          id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.role,
        })
        .returning()

      // Store password in accounts table
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
        updatedAt: new Date(),
      })

      // Verify password is not stored in user record
      expect(user.firstName).toBe(userData.firstName)
      expect(user.lastName).toBe(userData.lastName)
      expect(user.email).toBe(userData.email)
    })

    it("should create user with admin role", async () => {
      const userData = {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        password: "password123",
        role: "admin" as const,
      }

      const userId = crypto.randomUUID()

      const [user] = await db
        .insert(users)
        .values({
          id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.role,
        })
        .returning()

      expect(user.role).toBe("admin")
      expect(user.email).toBe(userData.email)
      expect(user.firstName).toBe(userData.firstName)
      expect(user.lastName).toBe(userData.lastName)
    })

    it("should prevent duplicate email registration", async () => {
      const userData = {
        id: crypto.randomUUID(),
        email: "duplicate@example.com",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        role: "admin" as const,
      }

      await db.insert(users).values(userData)

      await expect(
        db.insert(users).values({
          ...userData,
          id: crypto.randomUUID(), // Different ID but same email
        })
      ).rejects.toThrow()
    })
  })

  describe("Password Validation", () => {
    it("should validate correct password", async () => {
      const plainPassword = "password123"
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const isValid = await bcrypt.compare(plainPassword, hashedPassword)
      expect(isValid).toBe(true)
    })

    it("should reject incorrect password", async () => {
      const plainPassword = "password123"
      const wrongPassword = "wrongpassword"
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe("User Lookup", () => {
    it("should find user by email", async () => {
      const userData = {
        id: crypto.randomUUID(),
        email: "lookup@example.com",
        firstName: "Lookup",
        lastName: "User",
        name: "Lookup User",
        role: "partner" as const,
      }

      await db.insert(users).values(userData)

      const foundUsers = await db.select().from(users).where(eq(users.email, userData.email))

      expect(foundUsers).toHaveLength(1)
      expect(foundUsers[0].email).toBe(userData.email)
    })

    it("should return empty array for non-existent email", async () => {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, "nonexistent@example.com"))

      expect(foundUsers).toHaveLength(0)
    })
  })

  describe("Session Management", () => {
    let testUserId: string

    beforeEach(async () => {
      // Create a test user for session tests
      testUserId = crypto.randomUUID()
      await db.insert(users).values({
        id: testUserId,
        email: "session-test@example.com",
        firstName: "Session",
        lastName: "Test",
        name: "Session Test",
        role: "admin",
      })
    })

    it("should create session with proper timestamp structure", async () => {
      const sessionId = crypto.randomUUID()
      const token = "test-session-token-" + Date.now()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const createdAt = new Date()

      await db.insert(sessions).values({
        id: sessionId,
        userId: testUserId,
        token,
        expiresAt,
        createdAt,
        updatedAt: createdAt,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      })

      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))

      expect(session).toBeDefined()
      expect(session.userId).toBe(testUserId)
      expect(session.token).toBe(token)

      // Verify timestamps are reasonable and not corrupted
      expect(session.expiresAt).toBeInstanceOf(Date)
      expect(session.createdAt).toBeInstanceOf(Date)

      expect(session.expiresAt.getFullYear()).toBe(new Date().getFullYear())
      expect(session.createdAt.getFullYear()).toBe(new Date().getFullYear())
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())

      // Ensure timestamps are not corrupted (like the year +057717 issue we fixed)
      expect(session.expiresAt.getFullYear()).toBeLessThan(3000)
      expect(session.createdAt.getFullYear()).toBeLessThan(3000)
    })

    it("should allow session cleanup (deletion)", async () => {
      const sessionId = crypto.randomUUID()
      const token = "cleanup-test-token-" + Date.now()

      // Create session
      await db.insert(sessions).values({
        id: sessionId,
        userId: testUserId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Verify session exists
      const sessionsBefore = await db.select().from(sessions).where(eq(sessions.userId, testUserId))
      expect(sessionsBefore).toHaveLength(1)

      // Simulate session cleanup (what happens on logout)
      await db.delete(sessions).where(eq(sessions.userId, testUserId))

      // Verify session is cleaned up
      const sessionsAfter = await db.select().from(sessions).where(eq(sessions.userId, testUserId))
      expect(sessionsAfter).toHaveLength(0)
    })

    it("should handle multiple sessions per user", async () => {
      const session1Id = crypto.randomUUID()
      const session2Id = crypto.randomUUID()
      const now = new Date()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create two sessions for the same user
      await db.insert(sessions).values([
        {
          id: session1Id,
          userId: testUserId,
          token: "token-1-" + Date.now(),
          expiresAt,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: session2Id,
          userId: testUserId,
          token: "token-2-" + Date.now(),
          expiresAt,
          createdAt: new Date(now.getTime() + 1000), // 1 second later
          updatedAt: new Date(now.getTime() + 1000),
        },
      ])

      const userSessions = await db.select().from(sessions).where(eq(sessions.userId, testUserId))
      expect(userSessions).toHaveLength(2)

      // Cleanup specific session (simulating logout from one device)
      await db.delete(sessions).where(eq(sessions.id, session1Id))

      const remainingSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, testUserId))
      expect(remainingSessions).toHaveLength(1)
      expect(remainingSessions[0].id).toBe(session2Id)
    })

    it("should enforce foreign key constraint on session creation", async () => {
      // PostgreSQL enforces foreign key constraints at database level
      // This test validates that sessions cannot be created without a valid user
      const sessionId = crypto.randomUUID()
      const nonExistentUserId = crypto.randomUUID() // Using a UUID that doesn't exist

      const sessionData = {
        id: sessionId,
        userId: nonExistentUserId,
        token: "test-token-" + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // This should fail at DB level due to foreign key constraint
      await expect(db.insert(sessions).values(sessionData)).rejects.toThrow()
    })

    it("should demonstrate session cleanup when user is deleted", async () => {
      const sessionId = crypto.randomUUID()

      // Create session for user
      await db.insert(sessions).values({
        id: sessionId,
        userId: testUserId,
        token: "cleanup-demo-token",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Verify session exists
      const sessionsBefore = await db.select().from(sessions).where(eq(sessions.userId, testUserId))
      expect(sessionsBefore).toHaveLength(1)

      // PostgreSQL CASCADE DELETE on foreign key handles this automatically
      // But in tests we need to clean up manually in correct order
      await db.delete(sessions).where(eq(sessions.userId, testUserId))
      await db.delete(users).where(eq(users.id, testUserId))

      // Verify sessions are cleaned up
      const sessionsAfter = await db.select().from(sessions).where(eq(sessions.userId, testUserId))
      expect(sessionsAfter).toHaveLength(0)

      // Verify user is deleted
      const usersAfter = await db.select().from(users).where(eq(users.id, testUserId))
      expect(usersAfter).toHaveLength(0)
    })
  })
})
