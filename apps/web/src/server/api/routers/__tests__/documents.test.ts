/**
 * Documents Router Tests
 *
 * Tests document upload, listing, and deletion functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"

// Mock storage for Netlify Blobs
const mockStorage = new Map<string, ArrayBuffer>()

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

import { sql } from "drizzle-orm"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { categories } from "@/server/db/schema/categories"
import { CATEGORIES } from "@/server/db/types"

// Helper function to create a test image (1x1 pixel PNG)
async function createTestImage(): Promise<string> {
  // 1x1 pixel transparent PNG in base64
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  return base64
}

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

  describe("linkToEntity", () => {
    let documentId1: string
    let documentId2: string
    let costId: string
    let eventId: string
    let contactId: string
    let costCategoryId: string

    beforeEach(async () => {
      // Create cost category
      const costCategory = await caller.category.create({
        displayName: "Materials",
        type: "cost",
        parentId: null,
      })
      costCategoryId = costCategory.id

      // Upload test documents
      const base64Image = await createTestImage()
      const doc1 = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test-doc-1.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })
      documentId1 = doc1.id

      const doc2 = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test-doc-2.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })
      documentId2 = doc2.id

      // Create a cost (use past date to avoid validation error)
      const cost = await caller.costs.create({
        projectId,
        amount: 100000, // $1000 in cents
        description: "Test Cost",
        categoryId: costCategoryId,
        date: new Date("2024-01-01"),
      })
      costId = cost.id

      // Create an event
      const event = await caller.events.create({
        projectId,
        title: "Test Event",
        date: new Date(),
        categoryId: "milestone",
        relatedContactIds: [],
      })
      eventId = event.id

      // Create a contact
      const contactCategory = await caller.category.create({
        displayName: "Builder",
        type: "contact",
        parentId: null,
      })
      const contact = await caller.contacts.create({
        firstName: "Test",
        lastName: "Contact",
        categoryId: contactCategory.id,
        email: "test@example.com",
      })
      contactId = contact.id

      // Link contact to project
      await caller.projectContacts.addToProject({
        projectId,
        contactId: contact.id,
      })
    })

    test("links document to cost", async () => {
      const result = await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId1],
      })

      expect(result.success).toBe(true)
      expect(result.linksCreated).toBe(1)
    })

    test("links multiple documents to cost", async () => {
      const result = await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId1, documentId2],
      })

      expect(result.success).toBe(true)
      expect(result.linksCreated).toBe(2)
    })

    test("links document to event", async () => {
      const result = await caller.documents.linkToEntity({
        entityType: "event",
        entityId: eventId,
        documentIds: [documentId1],
      })

      expect(result.success).toBe(true)
      expect(result.linksCreated).toBe(1)
    })

    test("links document to contact", async () => {
      const result = await caller.documents.linkToEntity({
        entityType: "contact",
        entityId: contactId,
        documentIds: [documentId1],
      })

      expect(result.success).toBe(true)
      expect(result.linksCreated).toBe(1)
    })

    test("handles duplicate links gracefully (onConflictDoNothing)", async () => {
      // Link document first time
      await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId1],
      })

      // Link same document again
      const result = await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId1],
      })

      expect(result.success).toBe(true)
      expect(result.linksCreated).toBe(0) // No new links created due to conflict
    })

    test("rejects linking document from different project", async () => {
      // Create another project as otherUser
      const otherProject = await otherCaller.projects.create({
        name: "Other Project",
        address: {
          streetNumber: "456",
          streetName: "Other St",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "456 Other St, Melbourne VIC 3000",
        },
        startDate: new Date(),
        projectType: "renovation",
      })

      // Create cost category for otherUser
      const otherCostCategory = await otherCaller.category.create({
        displayName: "Materials",
        type: "cost",
        parentId: null,
      })

      const otherCost = await otherCaller.costs.create({
        projectId: otherProject.id,
        amount: 50000,
        description: "Other Cost",
        categoryId: otherCostCategory.id,
        date: new Date("2024-01-01"),
      })

      // Try to link testUser's document to otherUser's cost
      await expect(
        otherCaller.documents.linkToEntity({
          entityType: "cost",
          entityId: otherCost.id,
          documentIds: [documentId1],
        })
      ).rejects.toThrow("not found in project")
    })

    test("rejects linking to non-existent cost", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000"
      await expect(
        caller.documents.linkToEntity({
          entityType: "cost",
          entityId: fakeId,
          documentIds: [documentId1],
        })
      ).rejects.toThrow("Cost not found")
    })

    test("rejects linking to non-existent event", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000"
      await expect(
        caller.documents.linkToEntity({
          entityType: "event",
          entityId: fakeId,
          documentIds: [documentId1],
        })
      ).rejects.toThrow("Event not found")
    })

    test("rejects linking to non-existent contact", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000"
      await expect(
        caller.documents.linkToEntity({
          entityType: "contact",
          entityId: fakeId,
          documentIds: [documentId1],
        })
      ).rejects.toThrow("Contact not found")
    })

    test("rejects linking for unauthorized user", async () => {
      await expect(
        otherCaller.documents.linkToEntity({
          entityType: "cost",
          entityId: costId,
          documentIds: [documentId1],
        })
      ).rejects.toThrow("permission")
    })

    test("creates audit log entry on successful link", async () => {
      await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId1],
      })

      const auditLogs = await testDbInstance.db.query.auditLog.findMany({
        where: (auditLog, { eq }) => eq(auditLog.userId, testUser.id),
      })

      const linkLog = auditLogs.find((log) => log.action === "linked")
      expect(linkLog).toBeTruthy()
      expect(linkLog?.entityType).toBe("cost")
    })
  })

  describe("unlinkFromEntity", () => {
    let documentId: string
    let costId: string
    let eventId: string
    let costCategoryId: string

    beforeEach(async () => {
      // Create cost category
      const costCategory = await caller.category.create({
        displayName: "Materials",
        type: "cost",
        parentId: null,
      })
      costCategoryId = costCategory.id

      // Upload test document
      const base64Image = await createTestImage()
      const doc = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "test-doc.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })
      documentId = doc.id

      // Create a cost
      const cost = await caller.costs.create({
        projectId,
        amount: 100000,
        description: "Test Cost",
        categoryId: costCategoryId,
        date: new Date("2024-01-01"),
      })
      costId = cost.id

      // Create an event
      const event = await caller.events.create({
        projectId,
        title: "Test Event",
        date: new Date(),
        categoryId: "milestone",
        relatedContactIds: [],
      })
      eventId = event.id

      // Link document to cost
      await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId],
      })

      // Link document to event
      await caller.documents.linkToEntity({
        entityType: "event",
        entityId: eventId,
        documentIds: [documentId],
      })
    })

    test("unlinks document from cost", async () => {
      const result = await caller.documents.unlinkFromEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId],
      })

      expect(result.success).toBe(true)
    })

    test("unlinks document from event", async () => {
      const result = await caller.documents.unlinkFromEntity({
        entityType: "event",
        entityId: eventId,
        documentIds: [documentId],
      })

      expect(result.success).toBe(true)
    })

    test("rejects unlinking for unauthorized user", async () => {
      await expect(
        otherCaller.documents.unlinkFromEntity({
          entityType: "cost",
          entityId: costId,
          documentIds: [documentId],
        })
      ).rejects.toThrow("permission")
    })

    test("rejects unlinking from non-existent cost", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000"
      await expect(
        caller.documents.unlinkFromEntity({
          entityType: "cost",
          entityId: fakeId,
          documentIds: [documentId],
        })
      ).rejects.toThrow("Cost not found")
    })

    test("creates audit log entry on successful unlink", async () => {
      await caller.documents.unlinkFromEntity({
        entityType: "cost",
        entityId: costId,
        documentIds: [documentId],
      })

      const auditLogs = await testDbInstance.db.query.auditLog.findMany({
        where: (auditLog, { eq }) => eq(auditLog.userId, testUser.id),
      })

      const unlinkLog = auditLogs.find((log) => log.action === "unlinked")
      expect(unlinkLog).toBeTruthy()
      expect(unlinkLog?.entityType).toBe("cost")
    })
  })

  describe("listOrphaned", () => {
    test("lists documents with no entity links", async () => {
      // Upload multiple documents
      const base64Image = await createTestImage()
      const doc1 = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "orphan-1.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      const doc2 = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "orphan-2.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Create cost category
      const costCategory = await caller.category.create({
        displayName: "Materials",
        type: "cost",
        parentId: null,
      })

      // Link doc1 to a cost
      const cost = await caller.costs.create({
        projectId,
        amount: 100000,
        description: "Test Cost",
        categoryId: costCategory.id,
        date: new Date("2024-01-01"),
      })

      await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: cost.id,
        documentIds: [doc1.id],
      })

      // List orphaned documents
      const orphaned = await caller.documents.listOrphaned(projectId)

      // Only doc2 should be orphaned
      expect(orphaned).toHaveLength(1)
      expect(orphaned[0]!.id).toBe(doc2.id)
    })

    test("returns empty array when all documents are linked", async () => {
      // Upload document
      const base64Image = await createTestImage()
      const doc = await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "linked.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // Create cost category
      const costCategory = await caller.category.create({
        displayName: "Materials",
        type: "cost",
        parentId: null,
      })

      // Link to cost
      const cost = await caller.costs.create({
        projectId,
        amount: 100000,
        description: "Test Cost",
        categoryId: costCategory.id,
        date: new Date("2024-01-01"),
      })

      await caller.documents.linkToEntity({
        entityType: "cost",
        entityId: cost.id,
        documentIds: [doc.id],
      })

      // List orphaned documents
      const orphaned = await caller.documents.listOrphaned(projectId)

      expect(orphaned).toHaveLength(0)
    })

    test("returns all documents when no links exist", async () => {
      // Upload documents
      const base64Image = await createTestImage()
      await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "orphan-1.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      await caller.documents.upload({
        projectId,
        categoryId,
        file: {
          name: "orphan-2.jpg",
          size: 1024,
          type: "image/jpeg",
          data: `data:image/jpeg;base64,${base64Image}`,
        },
      })

      // List orphaned documents
      const orphaned = await caller.documents.listOrphaned(projectId)

      expect(orphaned).toHaveLength(2)
    })

    test("rejects listing orphaned for unauthorized user", async () => {
      await expect(otherCaller.documents.listOrphaned(projectId)).rejects.toThrow("permission")
    })
  })
})
