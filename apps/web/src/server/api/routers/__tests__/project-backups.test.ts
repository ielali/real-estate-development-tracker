/**
 * Project Backups Router Tests
 *
 * Story 6.2: Tests for backup tRPC endpoints
 *
 * Test coverage:
 * - RBAC enforcement (owner-only access)
 * - Rate limiting (JSON: 5/hour, ZIP: 2/hour)
 * - JSON backup generation
 * - ZIP backup generation
 * - Size estimation
 * - Backup history
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { documents } from "@/server/db/schema/documents"
import { categories } from "@/server/db/schema/categories"
import { TRPCError } from "@trpc/server"

// Mock document service
vi.mock("@/server/services/document.service", () => ({
  documentService: {
    getDocumentBlob: vi.fn().mockResolvedValue("mock-blob-content"),
  },
}))

// Mock rate limiter to allow precise control in tests
const mockRateLimitCheck = vi.fn().mockReturnValue(true)
const mockGetTimeUntilReset = vi.fn().mockReturnValue(3600000)

vi.mock("@/lib/rate-limiter", () => ({
  backupRateLimiter: {
    check: (...args: any[]) => mockRateLimitCheck(...args),
    getTimeUntilReset: (...args: any[]) => mockGetTimeUntilReset(...args),
  },
  RATE_LIMITS: {
    JSON: {
      MAX_REQUESTS: 5,
      WINDOW_MS: 3600000,
    },
    ZIP: {
      MAX_REQUESTS: 2,
      WINDOW_MS: 3600000,
    },
  },
}))

describe("Project Backups Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let projectOwner: User
  let partnerUser: User
  let ownerCaller: ReturnType<typeof appRouter.createCaller>
  let partnerCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string

  const createMockSession = (userId: string) => ({
    id: `session-${userId}`,
    userId,
    expiresAt: new Date(Date.now() + 86400000),
    token: `token-${userId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: "127.0.0.1",
    userAgent: "test",
  })

  const createMockContext = (user: User) => ({
    headers: new Headers(),
    db: testDbInstance.db,
    session: {
      session: createMockSession(user.id),
      user,
    },
    user,
  })

  beforeAll(async () => {
    testDbInstance = await createTestDb()
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  beforeEach(async () => {
    await testDbInstance.cleanup()
    vi.clearAllMocks()

    // Reset mock rate limiter behavior
    mockRateLimitCheck.mockReturnValue(true)
    mockGetTimeUntilReset.mockReturnValue(3600000)

    // Create test users
    projectOwner = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000001",
        email: "owner@example.com",
        name: "Project Owner",
        firstName: "Project",
        lastName: "Owner",
      })
      .returning()
      .then((rows) => rows[0]!)

    partnerUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000002",
        email: "partner@example.com",
        name: "Partner User",
        firstName: "Partner",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    ownerCaller = appRouter.createCaller(createMockContext(projectOwner))
    partnerCaller = appRouter.createCaller(createMockContext(partnerUser))

    // Create a test project
    const project = await ownerCaller.projects.create({
      name: "Test Project",
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
      },
      projectType: "renovation",
      startDate: new Date(),
    })

    projectId = project.id

    // Seed a document category for tests that need it
    await testDbInstance.db.insert(categories).values({
      id: "test-category-documents",
      displayName: "Documents",
      type: "document",
      createdAt: new Date(),
    })
  })

  describe("generateBackup - RBAC", () => {
    test("should allow project owner to generate JSON backup", async () => {
      const result = await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "json",
      })

      expect(result).toHaveProperty("backupData")
      expect(result).toHaveProperty("filename")
      expect(result).toHaveProperty("fileSize")
      expect(result.filename).toContain("-backup-")
      expect(result.filename).toMatch(/\.json$/)
    })

    test("should deny partner access to generate backup", async () => {
      // Add partner to project
      await testDbInstance.db.insert(projectAccess).values({
        id: "access-1",
        projectId,
        userId: partnerUser.id,
        role: "partner",
        invitedBy: projectOwner.id,
      })

      await expect(
        partnerCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        partnerCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })

    test("should deny non-project-member access", async () => {
      // Create another user who is not part of the project
      const otherUser = await testDbInstance.db
        .insert(users)
        .values({
          id: "00000000-0000-0000-0000-000000000003",
          email: "other@example.com",
          name: "Other User",
          firstName: "Other",
          lastName: "User",
        })
        .returning()
        .then((rows) => rows[0]!)

      const otherCaller = appRouter.createCaller(createMockContext(otherUser))

      await expect(
        otherCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe("generateBackup - Rate Limiting", () => {
    test("should enforce JSON rate limit", async () => {
      // Mock rate limiter to deny request
      mockRateLimitCheck.mockReturnValue(false)
      mockGetTimeUntilReset.mockReturnValue(1800000) // 30 minutes

      await expect(
        ownerCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        ownerCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: expect.stringContaining("JSON backup limit exceeded"),
      })
    })

    test("should enforce ZIP rate limit", async () => {
      // Mock rate limiter to deny request
      mockRateLimitCheck.mockReturnValue(false)
      mockGetTimeUntilReset.mockReturnValue(1800000)

      await expect(
        ownerCaller.projects.generateBackup({
          projectId,
          backupType: "zip",
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        ownerCaller.projects.generateBackup({
          projectId,
          backupType: "zip",
        })
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: expect.stringContaining("ZIP backup limit exceeded"),
      })
    })

    test("should include remaining time in rate limit error", async () => {
      mockRateLimitCheck.mockReturnValue(false)
      mockGetTimeUntilReset.mockReturnValue(1800000) // 30 minutes

      try {
        await ownerCaller.projects.generateBackup({
          projectId,
          backupType: "json",
        })
        expect.fail("Should have thrown rate limit error")
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        const trpcError = error as TRPCError
        expect(trpcError.message).toContain("30 minutes")
      }
    })
  })

  describe("generateBackup - JSON", () => {
    test("should generate valid JSON backup structure", async () => {
      const result = await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "json",
      })

      expect(result.backupData).toHaveProperty("version", "1.0.0")
      expect(result.backupData).toHaveProperty("exportedAt")
      expect(result.backupData).toHaveProperty("exportedBy")
      expect(result.backupData).toHaveProperty("project")
      expect(result.backupData).toHaveProperty("costs")
      expect(result.backupData).toHaveProperty("contacts")
      expect(result.backupData).toHaveProperty("events")
      expect(result.backupData).toHaveProperty("documents")
    })

    test("should include exporter information", async () => {
      const result = await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "json",
      })

      expect(result.backupData.exportedBy).toEqual({
        id: projectOwner.id,
        email: projectOwner.email,
        name: projectOwner.name,
      })
    })

    test("should generate valid filename", async () => {
      const result = await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "json",
      })

      expect(result.filename).toMatch(/^test-project-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/)
    })
  })

  describe("generateBackup - ZIP", () => {
    test("should generate ZIP backup", async () => {
      const result = await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "zip",
      })

      expect(result).toHaveProperty("zipData")
      expect(result).toHaveProperty("filename")
      expect(result).toHaveProperty("fileSize")
      expect(result.filename).toContain("-archive-")
      expect(result.filename).toMatch(/\.zip$/)
    })

    test("should include document count in metadata", async () => {
      // Get a category for the document
      const category = await testDbInstance.db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.type, "document"),
      })

      // Insert a test document directly
      await testDbInstance.db.insert(documents).values({
        id: "test-doc-1",
        projectId,
        fileName: "test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        blobUrl: "test://doc1",
        categoryId: category!.id,
        uploadedById: projectOwner.id,
      })

      await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "zip",
      })

      const history = await ownerCaller.projects.getBackupHistory({ projectId })
      const zipBackup = history.find((b) => b.backupType === "zip")

      expect(zipBackup).toBeDefined()
      expect(zipBackup!.documentCount).toBe(1)
    })
  })

  describe("estimateZipSize", () => {
    test("should allow project owner to estimate size", async () => {
      const result = await ownerCaller.projects.estimateZipSize({ projectId })

      expect(result).toHaveProperty("estimatedSize")
      expect(result).toHaveProperty("documentCount")
      expect(result.estimatedSize).toBeGreaterThan(0)
    })

    test("should deny partner access to estimate size", async () => {
      await testDbInstance.db.insert(projectAccess).values({
        id: "access-1",
        projectId,
        userId: partnerUser.id,
        role: "partner",
        invitedBy: projectOwner.id,
      })

      await expect(partnerCaller.projects.estimateZipSize({ projectId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })

    test("should provide warning for large archives", async () => {
      // Get a category for the documents
      const category = await testDbInstance.db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.type, "document"),
      })

      // Insert large documents to exceed 100MB warning threshold
      // After 70% compression: 200MB * 0.7 = 140MB > 100MB
      await testDbInstance.db.insert(documents).values([
        {
          id: "large-doc-1",
          projectId,
          fileName: "large1.pdf",
          fileSize: 100 * 1024 * 1024, // 100MB
          mimeType: "application/pdf",
          blobUrl: "test://large1",
          categoryId: category!.id,
          uploadedById: projectOwner.id,
        },
        {
          id: "large-doc-2",
          projectId,
          fileName: "large2.pdf",
          fileSize: 100 * 1024 * 1024, // 100MB
          mimeType: "application/pdf",
          blobUrl: "test://large2",
          categoryId: category!.id,
          uploadedById: projectOwner.id,
        },
      ])

      const result = await ownerCaller.projects.estimateZipSize({ projectId })

      expect(result.warningMessage).toBeDefined()
      expect(result.warningMessage).toContain("100MB")
    })
  })

  describe("getBackupHistory", () => {
    test("should allow project owner to view history", async () => {
      await ownerCaller.projects.generateBackup({
        projectId,
        backupType: "json",
      })

      const history = await ownerCaller.projects.getBackupHistory({ projectId })

      expect(history).toBeInstanceOf(Array)
      expect(history.length).toBeGreaterThan(0)
      expect(history[0]).toHaveProperty("backupType")
      expect(history[0]).toHaveProperty("fileSize")
      expect(history[0]).toHaveProperty("createdAt")
    })

    test("should deny partner access to history", async () => {
      await testDbInstance.db.insert(projectAccess).values({
        id: "access-1",
        projectId,
        userId: partnerUser.id,
        role: "partner",
        invitedBy: projectOwner.id,
      })

      await expect(partnerCaller.projects.getBackupHistory({ projectId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })

    test("should return backups in chronological order", async () => {
      await ownerCaller.projects.generateBackup({ projectId, backupType: "json" })
      await new Promise((resolve) => setTimeout(resolve, 10))
      await ownerCaller.projects.generateBackup({ projectId, backupType: "json" })

      const history = await ownerCaller.projects.getBackupHistory({ projectId })

      expect(history.length).toBeGreaterThanOrEqual(2)
      // Should be in descending order (newest first)
      const firstDate = new Date(history[0]!.createdAt).getTime()
      const secondDate = new Date(history[1]!.createdAt).getTime()
      expect(firstDate).toBeGreaterThanOrEqual(secondDate)
    })
  })
})
