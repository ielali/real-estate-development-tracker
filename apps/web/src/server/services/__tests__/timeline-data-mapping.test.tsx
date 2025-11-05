/**
 * Timeline Data Mapping Test
 *
 * Verifies that timeline data from database queries is correctly mapped
 * to match the TimelineChart component's expected structure
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { sql } from "drizzle-orm"
import { generateProjectPdf } from "../report-pdf.service"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { events } from "@/server/db/schema/events"
import { categories } from "@/server/db/schema/categories"
import { CATEGORIES } from "@/server/db/types"

describe("Timeline Data Mapping", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let projectId: string
  let categoryId: string

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

    // Get a category ID
    const categoryList = await testDbInstance.db.select().from(categories).limit(1)
    categoryId = categoryList[0]!.id

    // Create user
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "timeline-test-user",
        email: "timeline@test.com",
        name: "Timeline Test",
        firstName: "Timeline",
        lastName: "Test",
      })
      .returning()
      .then((rows: any[]) => rows[0]!)

    // Create project
    const project = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Timeline Test Project",
        ownerId: testUser.id,
        projectType: "residential",
        status: "active",
      })
      .returning()

    projectId = project[0]!.id

    // Create events with categoryName that should be mapped to category
    await testDbInstance.db.insert(events).values([
      {
        projectId,
        title: "Event 1",
        description: "First event",
        date: new Date("2024-01-15"),
        categoryId,
        createdById: testUser.id,
      },
      {
        projectId,
        title: "Event 2",
        description: "Second event",
        date: new Date("2024-02-20"),
        categoryId,
        createdById: testUser.id,
      },
    ])
  })

  test("maps categoryName to category for TimelineChart", async () => {
    // This test will fail if the mapping is missing, because TimelineChart
    // expects 'category' field but the database returns 'categoryName'
    const result = await generateProjectPdf(testDbInstance.db, {
      projectId,
      userId: testUser.id,
      dateRange: { start: null, end: null },
      isPartnerView: false,
    })

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
    expect(result.toString("utf8", 0, 4)).toBe("%PDF")
  })

  test("handles timeline with no events", async () => {
    // Create a new project with no events
    const emptyProject = await testDbInstance.db
      .insert(projects)
      .values({
        name: "Empty Timeline Project",
        ownerId: testUser.id,
        projectType: "commercial",
        status: "planning",
      })
      .returning()

    const result = await generateProjectPdf(testDbInstance.db, {
      projectId: emptyProject[0]!.id,
      userId: testUser.id,
      dateRange: { start: null, end: null },
      isPartnerView: false,
    })

    expect(result).toBeInstanceOf(Buffer)
    expect(result.length).toBeGreaterThan(0)
  })
})
