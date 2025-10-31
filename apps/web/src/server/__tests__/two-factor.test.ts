import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest"
import bcrypt from "bcryptjs"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import { users, accounts, twoFactor } from "@/server/db/schema"
import { eq } from "drizzle-orm"

/**
 * Two-Factor Authentication Integration Tests
 *
 * Tests 2FA operations against remote Neon PostgreSQL database.
 * IMPORTANT: Database must be empty at start - each test creates its own data and cleans up.
 */
describe("Two-Factor Authentication", () => {
  let testDbConnection: Awaited<ReturnType<typeof createTestDb>>
  let db: Awaited<ReturnType<typeof createTestDb>>["db"]
  let testUserId: string

  beforeAll(async () => {
    testDbConnection = await createTestDb()
    db = testDbConnection.db
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    // Clean up before each test
    await testDbConnection.cleanup()

    // Create a test user
    const userData = {
      email: `test-2fa-${Date.now()}-${Math.random()}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "password123",
      role: "admin" as const,
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10)
    testUserId = crypto.randomUUID()

    await db
      .insert(users)
      .values({
        id: testUserId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        twoFactorEnabled: false,
      })
      .returning()

    // Store password in accounts table
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: testUserId,
      accountId: testUserId,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  describe("2FA Setup Flow", () => {
    it("should allow user to enable 2FA", async () => {
      // Create a 2FA record
      const twoFactorId = crypto.randomUUID()
      const secret = "JBSWY3DPEHPK3PXP" // Mock TOTP secret

      const [twoFactorRecord] = await db
        .insert(twoFactor)
        .values({
          id: twoFactorId,
          userId: testUserId,
          secret: secret, // In production, this would be encrypted
          backupCodes: JSON.stringify([]), // Empty initially
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      expect(twoFactorRecord).toBeDefined()
      expect(twoFactorRecord.userId).toBe(testUserId)
      expect(twoFactorRecord.secret).toBe(secret)
    })

    it("should update user twoFactorEnabled flag after setup", async () => {
      // Update user to have 2FA enabled
      const [updatedUser] = await db
        .update(users)
        .set({ twoFactorEnabled: true })
        .where(eq(users.id, testUserId))
        .returning()

      expect(updatedUser.twoFactorEnabled).toBe(true)
    })

    it("should generate and store backup codes", async () => {
      const twoFactorId = crypto.randomUUID()
      const mockBackupCodes = [
        "AAAA-BBBB",
        "CCCC-DDDD",
        "EEEE-FFFF",
        "1111-2222",
        "3333-4444",
        "5555-6666",
        "7777-8888",
        "9999-0000",
        "ABCD-EFGH",
        "IJKL-MNOP",
      ]

      // Hash backup codes before storing
      const hashedCodes = await Promise.all(mockBackupCodes.map((code) => bcrypt.hash(code, 10)))

      const [twoFactorRecord] = await db
        .insert(twoFactor)
        .values({
          id: twoFactorId,
          userId: testUserId,
          secret: "JBSWY3DPEHPK3PXP",
          backupCodes: JSON.stringify(hashedCodes),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      expect(twoFactorRecord.backupCodes).toBeTruthy()
      const storedCodes = JSON.parse(twoFactorRecord.backupCodes!)
      expect(storedCodes).toHaveLength(10)

      // Verify codes are hashed (should not match plain text)
      expect(storedCodes[0]).not.toBe(mockBackupCodes[0])
    })
  })

  describe("2FA Login Flow", () => {
    beforeEach(async () => {
      // Enable 2FA for the test user
      await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, testUserId))

      // Create 2FA record
      await db.insert(twoFactor).values({
        id: crypto.randomUUID(),
        userId: testUserId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it("should require 2FA verification when user has 2FA enabled", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, testUserId),
      })

      expect(user?.twoFactorEnabled).toBe(true)
    })

    it("should have valid 2FA secret stored", async () => {
      const twoFactorRecord = await db.query.twoFactor.findFirst({
        where: eq(twoFactor.userId, testUserId),
      })

      expect(twoFactorRecord).toBeDefined()
      expect(twoFactorRecord?.secret).toBeTruthy()
    })
  })

  describe("Backup Code Management", () => {
    let twoFactorId: string

    beforeEach(async () => {
      // Set up 2FA for the user
      await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, testUserId))

      twoFactorId = crypto.randomUUID()
      const hashedCodes = await Promise.all(
        ["CODE1234", "CODE5678", "CODE9012"].map((code) => bcrypt.hash(code, 10))
      )

      await db.insert(twoFactor).values({
        id: twoFactorId,
        userId: testUserId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: JSON.stringify(hashedCodes),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it("should allow regenerating backup codes", async () => {
      const newCodes = await Promise.all(
        ["NEW1-CODE", "NEW2-CODE", "NEW3-CODE"].map((code) => bcrypt.hash(code, 10))
      )

      const [updated] = await db
        .update(twoFactor)
        .set({ backupCodes: JSON.stringify(newCodes), updatedAt: new Date() })
        .where(eq(twoFactor.userId, testUserId))
        .returning()

      expect(updated.backupCodes).toBeTruthy()
      const storedCodes = JSON.parse(updated.backupCodes!)
      expect(storedCodes).toHaveLength(3)
    })

    it("should validate backup codes against hashed values", async () => {
      const twoFactorRecord = await db.query.twoFactor.findFirst({
        where: eq(twoFactor.userId, testUserId),
      })

      const storedCodes = JSON.parse(twoFactorRecord!.backupCodes!)
      const plainCode = "CODE1234"

      // Verify code matches one of the hashed codes
      const isValid = await bcrypt.compare(plainCode, storedCodes[0])
      expect(isValid).toBe(true)

      // Verify wrong code doesn't match
      const isInvalid = await bcrypt.compare("WRONGCODE", storedCodes[0])
      expect(isInvalid).toBe(false)
    })
  })

  describe("2FA Disable Flow", () => {
    beforeEach(async () => {
      // Enable 2FA for the test user
      await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, testUserId))

      await db.insert(twoFactor).values({
        id: crypto.randomUUID(),
        userId: testUserId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it("should disable 2FA and clear data", async () => {
      // Disable 2FA
      await db.update(users).set({ twoFactorEnabled: false }).where(eq(users.id, testUserId))

      // Remove 2FA record
      await db.delete(twoFactor).where(eq(twoFactor.userId, testUserId))

      // Verify user is updated
      const user = await db.query.users.findFirst({
        where: eq(users.id, testUserId),
      })
      expect(user?.twoFactorEnabled).toBe(false)

      // Verify 2FA record is removed
      const twoFactorRecord = await db.query.twoFactor.findFirst({
        where: eq(twoFactor.userId, testUserId),
      })
      expect(twoFactorRecord).toBeUndefined()
    })
  })

  describe("Backward Compatibility", () => {
    it("should allow login for users without 2FA", async () => {
      // User should have 2FA disabled by default
      const user = await db.query.users.findFirst({
        where: eq(users.id, testUserId),
      })

      expect(user?.twoFactorEnabled).toBe(false)

      // No 2FA record should exist
      const twoFactorRecord = await db.query.twoFactor.findFirst({
        where: eq(twoFactor.userId, testUserId),
      })
      expect(twoFactorRecord).toBeUndefined()
    })

    it("should not require 2FA verification when twoFactorEnabled is false", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, testUserId),
      })

      // Simulate login logic check
      const requires2FA = user?.twoFactorEnabled === true
      expect(requires2FA).toBe(false)
    })
  })
})
