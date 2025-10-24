/**
 * Documents Router Tests
 *
 * Tests document upload, listing, and deletion functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"

// IMPORTANT: vi.mock must be at the top of the file (after imports from vitest)
// This is a Vitest requirement for hoisting mocks
vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    set: vi.fn(async (key: string, value: string | ArrayBuffer | Blob) => {
      // Convert to ArrayBuffer for consistent storage
      if (typeof value === "string") {
        const buffer = Buffer.from(value, "base64")
        mockStorage.set(key, buffer.buffer)
      } else if (value instanceof ArrayBuffer) {
        mockStorage.set(key, value)
      } else {
        // Blob - convert to ArrayBuffer
        const arrayBuffer = await value.arrayBuffer()
        mockStorage.set(key, arrayBuffer)
      }
    }),
    get: vi.fn(async (key: string) => {
      const stored = mockStorage.get(key)
      if (!stored) return null
      // Return as base64 string (matching Netlify Blobs behavior)
      return Buffer.from(stored).toString("base64")
    }),
    delete: vi.fn(async (key: string) => {
      mockStorage.delete(key)
    }),
    getURL: vi.fn((id: string) => `https://blob.example.com/${id}`),
  }),
  getDeployStore: () => ({
    set: vi.fn(async (key: string, value: string | ArrayBuffer | Blob) => {
      // Convert to ArrayBuffer for consistent storage
      if (typeof value === "string") {
        const buffer = Buffer.from(value, "base64")
        mockStorage.set(key, buffer.buffer)
      } else if (value instanceof ArrayBuffer) {
        mockStorage.set(key, value)
      } else {
        // Blob - convert to ArrayBuffer
        const arrayBuffer = await value.arrayBuffer()
        mockStorage.set(key, arrayBuffer)
      }
    }),
    get: vi.fn(async (key: string) => {
      const stored = mockStorage.get(key)
      if (!stored) return null
      // Return as base64 string (matching Netlify Blobs behavior)
      return Buffer.from(stored).toString("base64")
    }),
    delete: vi.fn(async (key: string) => {
      mockStorage.delete(key)
    }),
    getURL: vi.fn((id: string) => `https://blob.example.com/${id}`),
  }),
}))

import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"

describe("Documents Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let otherUser: User
  let caller: ReturnType<typeof appRouter.createCaller>
  let otherCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let categoryId: string

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

    // Clear mock storage between tests
    mockStorage.clear()

    // Seed categories (static reference data)
    const existingCategories = await testDbInstance.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)

    if (Number(existingCategories[0]?.count) === 0) {
      await testDbInstance.db.insert(categories).values(CATEGORIES)
    }

    // Create test users
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-1",
        email: "testuser@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    otherUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-2",
        email: "otheruser@example.com",
        name: "Other User",
        firstName: "Other",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    caller = appRouter.createCaller(createMockContext(testUser))
    otherCaller = appRouter.createCaller(createMockContext(otherUser))

    // Create a test project
    const project = await caller.projects.create({
      name: "Test Project",
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        formatted: "123 Test St, Sydney NSW 2000",
      },
      startDate: new Date("2024-01-01"),
      projectType: "renovation",
    })
    projectId = project.id

    // Use existing category from CATEGORIES
    categoryId = "photos"
  })

  describe("upload", () => {
    test("uploads document with valid file", async () => {
      const base64Image = await createTestImage()

      const result = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test.jpg",
          size: 1024 * 1024, // 1MB
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      expect(result).toMatchObject({
        fileName: "test.jpg",
        fileSize: 1024 * 1024,
        mimeType: "image/jpeg",
        projectId,
        categoryId,
        uploadedById: testUser.id,
      })
      expect(result.id).toBeTruthy()
      expect(result.blobUrl).toBe(result.id) // blobUrl is the documentId (blob key)
      expect(result.thumbnailUrl).toBe(`${result.id}-thumb`) // thumbnailUrl is documentId-thumb
    })

    test("rejects file over 10MB", async () => {
      const base64Data = Buffer.from("x".repeat(11 * 1024 * 1024)).toString("base64")

      await expect(
        caller.documents.upload({
          projectId,
          categoryId,
          file: {
            name: "large.jpg",
            size: 11 * 1024 * 1024, // 11MB
            type: "image/jpeg",
            data: `data:image/jpeg;base64,${base64Data}`,
          },
        })
      ).rejects.toThrow("File size must be under 10MB")
    })

    test("rejects invalid MIME type", async () => {
      const base64Data = Buffer.from("fake content").toString("base64")

      await expect(
        caller.documents.upload({
          projectId,
          categoryId,
          file: {
            name: "virus.exe",
            size: 1024,
            type: "application/x-msdownload",
            data: `data:application/x-msdownload;base64,${base64Data}`,
          },
        })
      ).rejects.toThrow("File type not supported")
    })

    test("rejects upload to project user does not own", async () => {
      const base64Image = await createTestImage()

      await expect(
        otherCaller.documents.upload({
          projectId, // testUser's project
          categoryId,
          file: {
            name: "test.jpg",
            size: 1024,
            type: "image/jpeg",
            data: `data:image/jpeg;base64,${base64Image}`,
          },
        })
      ).rejects.toThrow("permission")
    })

    test("creates audit log entry on successful upload", async () => {
      const base64Image = await createTestImage()

      await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "audit-test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Check audit log exists
      const auditLogs = await testDbInstance.db.query.auditLog.findMany({
        where: (auditLog, { eq }) => eq(auditLog.userId, testUser.id),
      })

      expect(auditLogs.length).toBeGreaterThan(0)
      const uploadLog = auditLogs.find((log) => log.action === "uploaded")
      expect(uploadLog).toBeTruthy()
      expect(uploadLog?.entityType).toBe("document")
    })
  })

  describe("list", () => {
    test("lists documents for owned project", async () => {
      // Upload a document first
      const base64Image = await createTestImage()
      const uploaded = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // List documents
      const result = await caller.documents.list({ projectId })

      expect(result.documents).toHaveLength(1)
      expect(result.documents[0]).toMatchObject({
        id: uploaded.id,
        fileName: "test.jpg",
        projectId,
      })
    })

    test("returns empty array for project with no documents", async () => {
      const result = await caller.documents.list({ projectId })
      expect(result.documents).toEqual([])
    })

    test("does not return deleted documents", async () => {
      // Upload and delete a document
      const base64Image = await createTestImage()
      const uploaded = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      await caller.documents.delete(uploaded.id)

      // List documents
      const result = await caller.documents.list({ projectId })
      expect(result.documents).toEqual([])
    })

    test("rejects listing documents for project user does not own", async () => {
      await expect(otherCaller.documents.list({ projectId })).rejects.toThrow("permission")
    })
  })

  describe("delete", () => {
    test("soft deletes document from owned project", async () => {
      // Upload a document first
      const base64Image = await createTestImage()
      const uploaded = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Delete the document
      const deleteResult = await caller.documents.delete(uploaded.id)
      expect(deleteResult.success).toBe(true)

      // Verify document is soft deleted (not in list)
      const listResult = await caller.documents.list({ projectId })
      expect(listResult.documents).toEqual([])
    })

    test("rejects deleting document from project user does not own", async () => {
      // Upload a document as testUser
      const base64Image = await createTestImage()
      const uploaded = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Try to delete as otherUser
      await expect(otherCaller.documents.delete(uploaded.id)).rejects.toThrow("permission")
    })

    test("returns error for non-existent document", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000"
      await expect(caller.documents.delete(fakeId)).rejects.toThrow("not found")
    })

    test("creates audit log entry on successful delete", async () => {
      // Upload a document first
      const base64Image = await createTestImage()
      const uploaded = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "delete-audit-test.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Delete the document
      await caller.documents.delete(uploaded.id)

      // Check audit log exists
      const auditLogs = await testDbInstance.db.query.auditLog.findMany({
        where: (auditLog, { eq }) => eq(auditLog.userId, testUser.id),
      })

      const deleteLog = auditLogs.find((log) => log.action === "deleted")
      expect(deleteLog).toBeTruthy()
      expect(deleteLog?.entityType).toBe("document")
    })
  })
})
