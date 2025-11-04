/**
 * Comments Router Tests
 * Story 8.3: Threaded Comments on Entities
 *
 * Tests comment CRUD operations, RBAC, one-level nesting, and notification generation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import { sql } from "drizzle-orm"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { categories } from "@/server/db/schema/categories"
import { CATEGORIES } from "@/server/db/types"
import { comments } from "@/server/db/schema/comments"
import { eq } from "drizzle-orm"

// Mock the notification service
vi.mock("@/server/services/notifications", () => ({
  notifyCommentAdded: vi.fn(),
  notifyPartnerInvited: vi.fn(),
  notifyCostAdded: vi.fn(),
}))

describe("Comments Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let otherUser: User
  let thirdUser: User
  let caller: ReturnType<typeof appRouter.createCaller>
  let otherCaller: ReturnType<typeof appRouter.createCaller>
  let thirdCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let costId: string
  let documentId: string
  let eventId: string

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

    // Seed categories
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

    thirdUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-3",
        email: "thirduser@example.com",
        name: "Third User",
        firstName: "Third",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    caller = appRouter.createCaller(createMockContext(testUser))
    otherCaller = appRouter.createCaller(createMockContext(otherUser))
    thirdCaller = appRouter.createCaller(createMockContext(thirdUser))

    // Create a test project
    const project = await caller.projects.create({
      name: "Test Project",
      projectType: "renovation",
      startDate: new Date("2025-01-01"),
      address: {
        streetNumber: "123",
        streetName: "Test St",
        suburb: "Test Suburb",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
      },
    })
    projectId = project.id

    // Invite and accept otherUser as partner
    await caller.partners.invitePartner({
      projectId,
      email: otherUser.email,
      permission: "write",
    })
    const invitation = await testDbInstance.db.query.projectAccess.findFirst({
      where: (projectAccess, { eq, and }) =>
        and(eq(projectAccess.projectId, projectId), eq(projectAccess.userId, otherUser.id)),
    })
    if (invitation) {
      await otherCaller.partners.acceptInvite({ projectId })
    }

    // Create test entities
    const cost = await caller.costs.create({
      projectId,
      description: "Test Cost",
      amount: 10000,
      date: new Date("2025-01-15"),
      categoryId: "cost_materials",
    })
    costId = cost.id

    const doc = await caller.documents.upload({
      projectId,
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      categoryId: "receipts",
      data: Buffer.from("test").toString("base64"),
    })
    documentId = doc.id

    const event = await caller.events.create({
      projectId,
      title: "Test Event",
      description: "Test event description",
      date: new Date("2025-02-01"),
      categoryId: "milestone",
    })
    eventId = event.id
  })

  describe("list", () => {
    test("returns empty array when no comments exist", async () => {
      const result = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(result).toEqual([])
    })

    test("returns comments for a cost entity", async () => {
      // Create a comment
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "This is a test comment",
      })

      const result = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: comment.id,
        content: "This is a test comment",
        entityType: "cost",
        entityId: costId,
        userId: testUser.id,
      })
      expect(result[0]?.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      })
    })

    test("returns comments sorted by createdAt ascending (oldest first)", async () => {
      // Create comments with different timestamps
      const comment1 = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "First comment",
      })

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const comment2 = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Second comment",
      })

      const result = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe(comment1.id)
      expect(result[1]?.id).toBe(comment2.id)
    })

    test("excludes deleted comments", async () => {
      // Create two comments
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "First comment",
      })

      const comment2 = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Second comment",
      })

      // Soft delete the second comment
      await caller.comments.delete({ commentId: comment2.id })

      const result = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.content).toBe("First comment")
    })

    test("returns nested replies with parent comments", async () => {
      // Create parent comment
      const parent = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Parent comment",
      })

      // Create reply
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Reply comment",
        parentCommentId: parent.id,
      })

      const result = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(result).toHaveLength(2)
      const parentResult = result.find((c) => c.id === parent.id)
      const replyResult = result.find((c) => c.parentCommentId === parent.id)

      expect(parentResult).toBeDefined()
      expect(replyResult).toBeDefined()
      expect(replyResult?.content).toBe("Reply comment")
    })
  })

  describe("create", () => {
    test("creates a comment successfully", async () => {
      const result = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "This is a test comment",
      })

      expect(result).toMatchObject({
        content: "This is a test comment",
        entityType: "cost",
        entityId: costId,
        projectId,
        userId: testUser.id,
        parentCommentId: null,
        deletedAt: null,
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    test("creates a reply to a comment successfully", async () => {
      const parent = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Parent comment",
      })

      const reply = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Reply comment",
        parentCommentId: parent.id,
      })

      expect(reply).toMatchObject({
        content: "Reply comment",
        parentCommentId: parent.id,
      })
    })

    test("enforces one-level nesting only", async () => {
      // Create parent comment
      const parent = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Parent comment",
      })

      // Create reply
      const reply = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Reply comment",
        parentCommentId: parent.id,
      })

      // Try to create a reply to a reply (should fail)
      await expect(
        caller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "Nested reply",
          parentCommentId: reply.id,
        })
      ).rejects.toThrow("Cannot reply to a reply - only one level nesting allowed")
    })

    test("validates content is not empty", async () => {
      await expect(
        caller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "",
        })
      ).rejects.toThrow()
    })

    test("validates content does not exceed 2000 characters", async () => {
      const longContent = "a".repeat(2001)

      await expect(
        caller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: longContent,
        })
      ).rejects.toThrow()
    })

    test("rejects comment from non-project member", async () => {
      // thirdUser is not a member of the project
      await expect(
        thirdCaller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "Unauthorized comment",
        })
      ).rejects.toThrow()
    })

    test("allows project partner to create comment", async () => {
      const result = await otherCaller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Partner comment",
      })

      expect(result).toMatchObject({
        content: "Partner comment",
        userId: otherUser.id,
      })
    })

    test("works for document entity", async () => {
      const result = await caller.comments.create({
        entityType: "document",
        entityId: documentId,
        projectId,
        content: "Document comment",
      })

      expect(result).toMatchObject({
        entityType: "document",
        entityId: documentId,
      })
    })

    test("works for event entity", async () => {
      const result = await caller.comments.create({
        entityType: "event",
        entityId: eventId,
        projectId,
        content: "Event comment",
      })

      expect(result).toMatchObject({
        entityType: "event",
        entityId: eventId,
      })
    })

    test("rejects comment with non-existent parent", async () => {
      await expect(
        caller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "Reply",
          parentCommentId: "non-existent-id",
        })
      ).rejects.toThrow()
    })
  })

  describe("update", () => {
    test("updates own comment successfully", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original content",
      })

      const result = await caller.comments.update({
        commentId: comment.id,
        content: "Updated content",
      })

      expect(result).toMatchObject({
        id: comment.id,
        content: "Updated content",
      })
      expect(result.updatedAt.getTime()).toBeGreaterThan(comment.createdAt.getTime())
    })

    test("rejects update of another user's comment", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original content",
      })

      await expect(
        otherCaller.comments.update({
          commentId: comment.id,
          content: "Hacked content",
        })
      ).rejects.toThrow("You can only edit your own comments")
    })

    test("validates updated content is not empty", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original content",
      })

      await expect(
        caller.comments.update({
          commentId: comment.id,
          content: "",
        })
      ).rejects.toThrow()
    })

    test("validates updated content does not exceed 2000 characters", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original content",
      })

      const longContent = "a".repeat(2001)

      await expect(
        caller.comments.update({
          commentId: comment.id,
          content: longContent,
        })
      ).rejects.toThrow()
    })

    test("updates updatedAt timestamp", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original content",
      })

      const originalUpdatedAt = comment.updatedAt

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updated = await caller.comments.update({
        commentId: comment.id,
        content: "Updated content",
      })

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe("delete", () => {
    test("soft deletes own comment successfully", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "To be deleted",
      })

      await caller.comments.delete({ commentId: comment.id })

      // Verify comment is soft deleted
      const deletedComment = await testDbInstance.db.query.comments.findFirst({
        where: eq(comments.id, comment.id),
      })

      expect(deletedComment?.deletedAt).not.toBeNull()
    })

    test("allows project owner to delete any comment", async () => {
      // otherUser creates a comment
      const comment = await otherCaller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Partner comment",
      })

      // testUser (project owner) deletes it
      await caller.comments.delete({ commentId: comment.id })

      // Verify comment is soft deleted
      const deletedComment = await testDbInstance.db.query.comments.findFirst({
        where: eq(comments.id, comment.id),
      })

      expect(deletedComment?.deletedAt).not.toBeNull()
    })

    test("rejects deletion by non-owner non-project-owner", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Original comment",
      })

      // otherUser (partner but not comment owner or project owner) tries to delete
      await expect(otherCaller.comments.delete({ commentId: comment.id })).rejects.toThrow()
    })

    test("excludes deleted comment from list query", async () => {
      const comment = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "To be deleted",
      })

      await caller.comments.delete({ commentId: comment.id })

      const list = await caller.comments.list({
        entityType: "cost",
        entityId: costId,
      })

      expect(list).toHaveLength(0)
    })

    test("decrements comment count after deletion", async () => {
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 1",
      })

      const comment2 = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 2",
      })

      let count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })
      expect(count).toBe(2)

      await caller.comments.delete({ commentId: comment2.id })

      count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })
      expect(count).toBe(1)
    })
  })

  describe("getCount", () => {
    test("returns 0 when no comments exist", async () => {
      const count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })

      expect(count).toBe(0)
    })

    test("returns correct count of comments", async () => {
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 1",
      })

      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 2",
      })

      const count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })

      expect(count).toBe(2)
    })

    test("includes replies in count", async () => {
      const parent = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Parent",
      })

      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Reply",
        parentCommentId: parent.id,
      })

      const count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })

      expect(count).toBe(2)
    })

    test("excludes deleted comments from count", async () => {
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 1",
      })

      const comment2 = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Comment 2",
      })

      await caller.comments.delete({ commentId: comment2.id })

      const count = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })

      expect(count).toBe(1)
    })

    test("returns correct count for different entity types", async () => {
      // Create comments for different entities
      await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Cost comment",
      })

      await caller.comments.create({
        entityType: "document",
        entityId: documentId,
        projectId,
        content: "Document comment",
      })

      const costCount = await caller.comments.getCount({
        entityType: "cost",
        entityId: costId,
      })

      const docCount = await caller.comments.getCount({
        entityType: "document",
        entityId: documentId,
      })

      expect(costCount).toBe(1)
      expect(docCount).toBe(1)
    })
  })

  describe("RBAC", () => {
    test("requires authentication for all operations", async () => {
      const unauthenticatedCaller = appRouter.createCaller({
        headers: new Headers(),
        db: testDbInstance.db,
        session: null,
        user: undefined,
      })

      await expect(
        unauthenticatedCaller.comments.list({
          entityType: "cost",
          entityId: costId,
        })
      ).rejects.toThrow()

      await expect(
        unauthenticatedCaller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "Test",
        })
      ).rejects.toThrow()
    })

    test("requires project membership to create comments", async () => {
      // thirdUser is not a member of the project
      await expect(
        thirdCaller.comments.create({
          entityType: "cost",
          entityId: costId,
          projectId,
          content: "Unauthorized",
        })
      ).rejects.toThrow()
    })

    test("allows project owner to create comments", async () => {
      const result = await caller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Owner comment",
      })

      expect(result.userId).toBe(testUser.id)
    })

    test("allows project partner to create comments", async () => {
      const result = await otherCaller.comments.create({
        entityType: "cost",
        entityId: costId,
        projectId,
        content: "Partner comment",
      })

      expect(result.userId).toBe(otherUser.id)
    })
  })
})
