/**
 * Search Router Tests (Story 7.1)
 *
 * Tests global search functionality with PostgreSQL full-text search
 * and RBAC filtering.
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest"
import { sql } from "drizzle-orm"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { documents } from "@/server/db/schema/documents"
import { categories } from "@/server/db/schema/categories"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { projectContact } from "@/server/db/schema/projectContact"
import { TRPCError } from "@trpc/server"

describe("Search Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let ownerUser: User
  let partnerUser: User
  let unrelatedUser: User
  let ownerCaller: ReturnType<typeof appRouter.createCaller>
  let partnerCaller: ReturnType<typeof appRouter.createCaller>
  let unrelatedCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let secondProjectId: string
  let costCategoryId: string
  let contactCategoryId: string
  let documentCategoryId: string
  let costId: string
  let contactId: string
  let documentId: string

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

  beforeAll(async () => {
    testDbInstance = await createTestDb()
    const { db } = testDbInstance

    // Create test users
    const [owner, partner, unrelated] = await db
      .insert(users)
      .values([
        {
          id: "owner-user-id",
          email: "owner@test.com",
          name: "Owner User",
          firstName: "Owner",
          lastName: "User",
          emailVerified: true,
          role: "admin",
        },
        {
          id: "partner-user-id",
          email: "partner@test.com",
          name: "Partner User",
          firstName: "Partner",
          lastName: "User",
          emailVerified: true,
          role: "user",
        },
        {
          id: "unrelated-user-id",
          email: "unrelated@test.com",
          name: "Unrelated User",
          firstName: "Unrelated",
          lastName: "User",
          emailVerified: true,
          role: "user",
        },
      ])
      .returning()

    if (!owner || !partner || !unrelated) {
      throw new Error("Failed to create test users")
    }

    ownerUser = owner
    partnerUser = partner
    unrelatedUser = unrelated

    // Create categories with explicit type values
    const [costCategory, contactCategory, documentCategory] = await db
      .insert(categories)
      .values([
        {
          id: "cost-cat-1",
          type: "cost",
          displayName: "Labor",
          isCustom: false,
        },
        {
          id: "contact-cat-1",
          type: "contact",
          displayName: "Contractor",
          isCustom: false,
        },
        {
          id: "doc-cat-1",
          type: "document",
          displayName: "Contracts",
          isCustom: false,
        },
      ])
      .returning()

    if (!costCategory || !contactCategory || !documentCategory) {
      throw new Error("Failed to create categories")
    }

    costCategoryId = costCategory.id
    contactCategoryId = contactCategory.id
    documentCategoryId = documentCategory.id

    // Create test projects
    const [project1, project2] = await db
      .insert(projects)
      .values([
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Kitchen Renovation Project",
          description: "Complete kitchen remodel with new appliances",
          projectType: "renovation",
          status: "active",
          ownerId: ownerUser.id,
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          name: "Bathroom Renovation",
          description: "Master bathroom upgrade",
          projectType: "renovation",
          status: "active",
          ownerId: ownerUser.id,
        },
      ])
      .returning()

    if (!project1 || !project2) {
      throw new Error("Failed to create projects")
    }

    projectId = project1.id
    secondProjectId = project2.id

    // Grant partner access to project 1 only
    await db.insert(projectAccess).values({
      projectId: projectId,
      userId: partnerUser.id,
      permission: "read",
      acceptedAt: new Date(), // Partner has accepted the invitation
    })

    // Create contact
    const [contact] = await db
      .insert(contacts)
      .values({
        id: "00000000-0000-4000-8000-000000000011",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@contractor.com",
        company: "Johnson Construction",
        categoryId: contactCategoryId,
      })
      .returning()

    if (!contact) {
      throw new Error("Failed to create contact")
    }

    contactId = contact.id

    // Link contact to project 1
    await db.insert(projectContact).values({
      projectId: projectId,
      contactId: contactId,
    })

    // Create cost
    const [cost] = await db
      .insert(costs)
      .values({
        id: "00000000-0000-4000-8000-000000000021",
        projectId: projectId,
        description: "Kitchen cabinets installation",
        amount: 500000, // $5000.00
        categoryId: costCategoryId,
        date: new Date("2024-01-15"),
        createdById: ownerUser.id,
      })
      .returning()

    if (!cost) {
      throw new Error("Failed to create cost")
    }

    costId = cost.id

    // Create document
    const [document] = await db
      .insert(documents)
      .values({
        id: "00000000-0000-4000-8000-000000000031",
        projectId: projectId,
        fileName: "kitchen-contract.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        blobUrl: "https://example.com/kitchen-contract.pdf",
        categoryId: documentCategoryId,
        uploadedById: ownerUser.id,
      })
      .returning()

    if (!document) {
      throw new Error("Failed to create document")
    }

    documentId = document.id

    // Update search vectors manually for tests
    // In production, triggers handle this automatically
    await db.execute(sql`
      UPDATE projects
      SET search_vector =
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
      WHERE id IN (${projectId}, ${secondProjectId})
    `)

    await db.execute(sql`
      UPDATE costs
      SET search_vector = to_tsvector('english', coalesce(description, ''))
      WHERE id = ${costId}
    `)

    await db.execute(sql`
      UPDATE contacts
      SET search_vector =
        setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(last_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(email, '')), 'C')
      WHERE id = ${contactId}
    `)

    await db.execute(sql`
      UPDATE documents
      SET search_vector = to_tsvector('english', regexp_replace(coalesce(file_name, ''), '[^a-zA-Z0-9\\s]', ' ', 'g'))
      WHERE id = ${documentId}
    `)

    // Create callers with proper session structure
    // Context expects: { db, session, user, headers }
    // where user is at the top level (see trpc.ts:26)
    ownerCaller = appRouter.createCaller({
      db,
      session: {
        session: createMockSession(ownerUser.id),
        user: ownerUser,
      },
      user: ownerUser,
      headers: new Headers(),
    })

    partnerCaller = appRouter.createCaller({
      db,
      session: {
        session: createMockSession(partnerUser.id),
        user: partnerUser,
      },
      user: partnerUser,
      headers: new Headers(),
    })

    unrelatedCaller = appRouter.createCaller({
      db,
      session: {
        session: createMockSession(unrelatedUser.id),
        user: unrelatedUser,
      },
      user: unrelatedUser,
      headers: new Headers(),
    })
  })

  afterAll(async () => {
    await cleanupAllTestDatabases()
  })

  describe("globalSearch", () => {
    test("should search across all entity types", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen",
        limit: 50,
      })

      expect(result.totalCount).toBeGreaterThan(0)

      // Should find project, cost, and document with "kitchen"
      const entityTypes = result.results.map((r) => r.entityType)
      expect(entityTypes).toContain("project")
      expect(entityTypes).toContain("cost")
      expect(entityTypes).toContain("document")

      // Verify project result
      const projectResult = result.results.find((r) => r.entityType === "project")
      expect(projectResult).toBeDefined()
      expect(projectResult?.title).toBe("Kitchen Renovation Project")
      expect(projectResult?.preview).toContain("Complete kitchen remodel")

      // Verify cost result
      const costResult = result.results.find((r) => r.entityType === "cost")
      expect(costResult).toBeDefined()
      expect(costResult?.title).toBe("Kitchen cabinets installation")
      expect(costResult?.projectContext?.projectId).toBe(projectId)

      // Verify document result
      const documentResult = result.results.find((r) => r.entityType === "document")
      expect(documentResult).toBeDefined()
      expect(documentResult?.title).toBe("kitchen-contract.pdf")
    })

    test("should respect RBAC - partner sees only accessible projects", async () => {
      const result = await partnerCaller.search.globalSearch({
        query: "renovation",
        limit: 50,
      })

      // Partner should only see project 1, not project 2
      const projectResults = result.results.filter((r) => r.entityType === "project")
      expect(projectResults).toHaveLength(1)
      expect(projectResults[0]?.entityId).toBe(projectId)
      expect(projectResults[0]?.title).toBe("Kitchen Renovation Project")

      // Verify they don't see the bathroom project
      const bathroomProject = projectResults.find((r) => r.title.includes("Bathroom"))
      expect(bathroomProject).toBeUndefined()
    })

    test("should respect RBAC - unrelated user sees no results", async () => {
      const result = await unrelatedCaller.search.globalSearch({
        query: "kitchen",
        limit: 50,
      })

      expect(result.totalCount).toBe(0)
      expect(result.results).toHaveLength(0)
    })

    test("should filter by entity type", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen",
        entityTypes: ["project"],
        limit: 50,
      })

      expect(result.totalCount).toBeGreaterThan(0)
      result.results.forEach((r) => {
        expect(r.entityType).toBe("project")
      })
    })

    test("should filter by specific project", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen",
        projectId: projectId,
        limit: 50,
      })

      expect(result.totalCount).toBeGreaterThan(0)
      result.results.forEach((r) => {
        if (r.projectContext) {
          expect(r.projectContext.projectId).toBe(projectId)
        } else {
          // Project results don't have projectContext
          expect(r.entityType).toBe("project")
          expect(r.entityId).toBe(projectId)
        }
      })
    })

    test("should return empty results for queries < 2 characters", async () => {
      await expect(
        ownerCaller.search.globalSearch({
          query: "k",
          limit: 50,
        })
      ).rejects.toThrow("Search query must be at least 2 characters")
    })

    test("should handle special characters safely", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen & renovation", // Special chars will be sanitized to "kitchen & renovation"
        limit: 50,
      })

      // Should sanitize and still return results
      expect(result.totalCount).toBeGreaterThan(0)
      // Should find the Kitchen Renovation Project
      expect(result.results.some((r) => r.entityType === "project")).toBe(true)
    })

    test("should handle empty query after sanitization", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "!!!###$$$",
        limit: 50,
      })

      expect(result.totalCount).toBe(0)
      expect(result.results).toHaveLength(0)
    })

    test("should search contact names", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "alice",
        entityTypes: ["contact"],
        limit: 50,
      })

      expect(result.totalCount).toBe(1)
      expect(result.results[0]?.entityType).toBe("contact")
      expect(result.results[0]?.title).toBe("Alice Johnson")
      expect(result.results[0]?.preview).toContain("Johnson Construction")
    })

    test("should search contact companies", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "construction",
        entityTypes: ["contact"],
        limit: 50,
      })

      expect(result.totalCount).toBe(1)
      expect(result.results[0]?.entityType).toBe("contact")
      expect(result.results[0]?.title).toBe("Alice Johnson")
    })

    test("should throw FORBIDDEN when accessing unauthorized project", async () => {
      await expect(
        partnerCaller.search.globalSearch({
          query: "bathroom",
          projectId: secondProjectId, // Partner doesn't have access
          limit: 50,
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        partnerCaller.search.globalSearch({
          query: "bathroom",
          projectId: secondProjectId,
          limit: 50,
        })
      ).rejects.toThrow("You do not have access to this project")
    })

    test("should respect limit parameter", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "renovation",
        limit: 1,
      })

      expect(result.results.length).toBeLessThanOrEqual(1)
    })

    test("should include project context for costs", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "cabinets",
        entityTypes: ["cost"],
        limit: 50,
      })

      expect(result.totalCount).toBe(1)
      const costResult = result.results[0]
      expect(costResult?.projectContext).toBeDefined()
      expect(costResult?.projectContext?.projectId).toBe(projectId)
      expect(costResult?.projectContext?.projectName).toBe("Kitchen Renovation Project")
    })

    test("should include project context for documents", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "contract",
        entityTypes: ["document"],
        limit: 50,
      })

      expect(result.totalCount).toBe(1)
      const documentResult = result.results[0]
      expect(documentResult?.projectContext).toBeDefined()
      expect(documentResult?.projectContext?.projectId).toBe(projectId)
      expect(documentResult?.projectContext?.projectName).toBe("Kitchen Renovation Project")
    })

    test("should include project context for contacts", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "alice",
        entityTypes: ["contact"],
        limit: 50,
      })

      expect(result.totalCount).toBe(1)
      const contactResult = result.results[0]
      expect(contactResult?.projectContext).toBeDefined()
      expect(contactResult?.projectContext?.projectId).toBe(projectId)
    })

    test("should sort results by relevance rank", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "renovation",
        limit: 50,
      })

      expect(result.totalCount).toBeGreaterThan(0)

      // Verify results are sorted by rank descending
      for (let i = 0; i < result.results.length - 1; i++) {
        const current = result.results[i]
        const next = result.results[i + 1]
        if (current && next) {
          expect(current.rank).toBeGreaterThanOrEqual(next.rank)
        }
      }
    })

    test("should handle multi-word queries with AND logic", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen renovation",
        limit: 50,
      })

      // Should find results containing both "kitchen" AND "renovation"
      expect(result.totalCount).toBeGreaterThan(0)
      const projectResult = result.results.find((r) => r.entityType === "project")
      expect(projectResult?.title).toBe("Kitchen Renovation Project")
    })

    test("should truncate long previews", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "renovation",
        limit: 50,
      })

      result.results.forEach((r) => {
        if (r.preview) {
          // Preview should be truncated to 150 chars + "..."
          expect(r.preview.length).toBeLessThanOrEqual(153)
        }
      })
    })

    test("should include matched fields in results", async () => {
      const result = await ownerCaller.search.globalSearch({
        query: "kitchen",
        limit: 50,
      })

      expect(result.totalCount).toBeGreaterThan(0)

      result.results.forEach((r) => {
        expect(r.matchedFields).toBeDefined()
        expect(Array.isArray(r.matchedFields)).toBe(true)
        expect(r.matchedFields.length).toBeGreaterThan(0)
      })
    })

    test("should not return deleted entities", async () => {
      const { db } = testDbInstance

      // Soft delete the project
      await db.execute(sql`
        UPDATE projects
        SET deleted_at = NOW()
        WHERE id = ${projectId}
      `)

      const result = await ownerCaller.search.globalSearch({
        query: "kitchen",
        limit: 50,
      })

      // Should not find the deleted project
      const projectResults = result.results.filter((r) => r.entityType === "project")
      const deletedProject = projectResults.find((r) => r.entityId === projectId)
      expect(deletedProject).toBeUndefined()

      // Restore project for other tests
      await db.execute(sql`
        UPDATE projects
        SET deleted_at = NULL
        WHERE id = ${projectId}
      `)
    })
  })
})
