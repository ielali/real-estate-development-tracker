/**
 * Timeline Router Integration Tests
 *
 * Tests for timeline tRPC endpoint including:
 * - Timeline data transformation from events
 * - Phase auto-generation from project duration
 * - Milestone mapping from milestone events
 * - Authorization and access control
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { sql } from "drizzle-orm"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import { users } from "@/server/db/schema/users"
import { projects } from "@/server/db/schema/projects"
import { events } from "@/server/db/schema/events"
import { categories } from "@/server/db/schema/categories"
import { CATEGORIES } from "@/server/db/types"
import type { User } from "@/server/db/schema/users"

describe("Timeline Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
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

    // Seed categories
    const existingCategories = await testDbInstance.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
    if (Number(existingCategories[0]?.count) === 0) {
      await testDbInstance.db.insert(categories).values(CATEGORIES)
    }

    // Create test user
    testUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "timeline-test-user",
        email: "timeline-test@example.com",
        name: "Timeline Test User",
        firstName: "Timeline",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    // Create test project with dates
    const project = await testDbInstance.db
      .insert(projects)
      .values({
        id: "timeline-test-project",
        name: "Test Timeline Project",
        userId: testUser.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      })
      .returning()
      .then((rows) => rows[0]!)

    projectId = project.id
  })

  it("generates monthly phases for project duration", async () => {
    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    const timeline = await caller.timeline.getByProject({ projectId })

    // 6-month project should have 6 monthly phases
    expect(timeline.phases).toHaveLength(6)
    expect(timeline.phases[0].name).toMatch(/January 2025/)
    expect(timeline.phases[5].name).toMatch(/June 2025/)
  })

  it("maps milestone events to timeline milestones", async () => {
    // Create milestone events
    await testDbInstance.db.insert(events).values([
      {
        id: crypto.randomUUID(),
        title: "Project Kickoff",
        description: "Initial planning meeting",
        date: new Date("2025-01-15"),
        categoryId: "milestone",
        projectId,
        createdById: testUser.id,
      },
      {
        id: crypto.randomUUID(),
        title: "Design Review",
        description: "Review architectural design",
        date: new Date("2025-03-01"),
        categoryId: "milestone",
        projectId,
        createdById: testUser.id,
      },
      {
        id: crypto.randomUUID(),
        title: "Team Meeting",
        description: "Regular team sync",
        date: new Date("2025-02-01"),
        categoryId: "meeting", // Not a milestone
        projectId,
        createdById: testUser.id,
      },
    ])

    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    const timeline = await caller.timeline.getByProject({ projectId })

    // Should only include milestone events, not meetings
    expect(timeline.milestones).toHaveLength(2)
    expect(timeline.milestones[0].name).toBe("Project Kickoff")
    expect(timeline.milestones[1].name).toBe("Design Review")
  })

  it("assigns correct phase IDs to milestones", async () => {
    // Create milestone in January (phase 1) and March (phase 3)
    await testDbInstance.db.insert(events).values([
      {
        id: crypto.randomUUID(),
        title: "Jan Milestone",
        description: "First month",
        date: new Date("2025-01-15"),
        categoryId: "milestone",
        projectId,
        createdById: testUser.id,
      },
      {
        id: crypto.randomUUID(),
        title: "Mar Milestone",
        description: "Third month",
        date: new Date("2025-03-15"),
        categoryId: "milestone",
        projectId,
        createdById: testUser.id,
      },
    ])

    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    const timeline = await caller.timeline.getByProject({ projectId })

    // Jan milestone should belong to first phase
    const janMilestone = timeline.milestones.find((m) => m.name === "Jan Milestone")
    expect(janMilestone?.phaseId).toBe("phase-1")

    // Mar milestone should belong to third phase
    const marMilestone = timeline.milestones.find((m) => m.name === "Mar Milestone")
    expect(marMilestone?.phaseId).toBe("phase-3")
  })

  it("throws NOT_FOUND for non-existent project", async () => {
    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    await expect(caller.timeline.getByProject({ projectId: crypto.randomUUID() })).rejects.toThrow(
      "Project not found"
    )
  })

  it("throws FORBIDDEN for unauthorized user", async () => {
    // Create another user
    const otherUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "other-test-user",
        email: "other@example.com",
        name: "Other User",
        firstName: "Other",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    const ctx = createMockContext(otherUser)
    const caller = appRouter.createCaller(ctx)

    await expect(caller.timeline.getByProject({ projectId })).rejects.toThrow(
      /not have access|forbidden/i
    )
  })

  it("returns empty milestones array when no milestone events exist", async () => {
    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    const timeline = await caller.timeline.getByProject({ projectId })

    expect(timeline.milestones).toHaveLength(0)
    expect(timeline.phases.length).toBeGreaterThan(0) // Phases still generated
  })

  it("handles project without start/end dates by using defaults", async () => {
    // Create project without dates
    const noDatesProject = await testDbInstance.db
      .insert(projects)
      .values({
        id: "no-dates-project",
        name: "No Dates Project",
        userId: testUser.id,
        // startDate and endDate will be null
      })
      .returning()
      .then((rows) => rows[0]!)

    const ctx = createMockContext(testUser)
    const caller = appRouter.createCaller(ctx)

    const timeline = await caller.timeline.getByProject({ projectId: noDatesProject.id })

    // Should use default 6-month duration
    expect(timeline.phases.length).toBeGreaterThan(0)
    expect(timeline.phases.length).toBeLessThanOrEqual(12)
  })
})
