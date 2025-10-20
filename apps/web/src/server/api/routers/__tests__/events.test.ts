/**
 * Events Router Tests
 *
 * Tests event creation, listing, filtering, updating, and deletion functionality
 * Includes tests for junction table relationships and authorization
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"

describe("Events Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let testUser: User
  let otherUser: User
  let caller: ReturnType<typeof appRouter.createCaller>
  let otherCaller: ReturnType<typeof appRouter.createCaller>
  let projectId: string
  let contact1Id: string
  let contact2Id: string

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

    // Create contact category using the category API
    const contactCategory = await caller.category.create({
      displayName: "Builder",
      type: "contact",
      parentId: null,
    })

    // Create test contacts
    const contact1 = await caller.contacts.create({
      firstName: "John",
      lastName: "Builder",
      categoryId: contactCategory.id,
      email: "john@example.com",
    })
    contact1Id = contact1.id

    const contact2 = await caller.contacts.create({
      firstName: "Jane",
      lastName: "Inspector",
      categoryId: contactCategory.id,
      email: "jane@example.com",
    })
    contact2Id = contact2.id
  })

  describe("create", () => {
    test("creates event with valid data", async () => {
      const event = await caller.events.create({
        projectId,
        title: "Foundation inspection",
        description: "First inspection with council",
        date: new Date("2025-10-25"),
        categoryId: "inspection",
        relatedContactIds: [contact1Id],
      })

      expect(event).toMatchObject({
        title: "Foundation inspection",
        description: "First inspection with council",
        categoryId: "inspection",
        projectId,
        createdById: testUser.id,
      })
      expect(event.id).toBeDefined()
      expect(event.date).toBeInstanceOf(Date)
    })

    test("creates event without description and contacts", async () => {
      const event = await caller.events.create({
        projectId,
        title: "Milestone reached",
        date: new Date("2025-10-20"),
        categoryId: "milestone",
        relatedContactIds: [],
      })

      expect(event).toMatchObject({
        title: "Milestone reached",
        description: null,
        categoryId: "milestone",
      })
    })

    test("rejects creation for non-existent project", async () => {
      await expect(
        caller.events.create({
          projectId: "non-existent-project",
          title: "Test Event",
          date: new Date(),
          categoryId: "milestone",
          relatedContactIds: [],
        })
      ).rejects.toThrow()
    })

    test("rejects creation for unauthorized user", async () => {
      await expect(
        otherCaller.events.create({
          projectId,
          title: "Unauthorized Event",
          date: new Date(),
          categoryId: "milestone",
          relatedContactIds: [],
        })
      ).rejects.toThrow("FORBIDDEN")
    })

    test("links multiple contacts to event", async () => {
      const event = await caller.events.create({
        projectId,
        title: "Team Meeting",
        date: new Date("2025-10-25"),
        categoryId: "meeting",
        relatedContactIds: [contact1Id, contact2Id],
      })

      // Query the event with contacts
      const eventsList = await caller.events.list({ projectId })
      const createdEvent = eventsList.events.find((e) => e.id === event.id)

      expect(createdEvent?.eventContacts).toHaveLength(2)
    })
  })

  describe("list", () => {
    beforeEach(async () => {
      // Create multiple test events
      await caller.events.create({
        projectId,
        title: "Milestone 1",
        date: new Date("2025-10-20"),
        categoryId: "milestone",
        relatedContactIds: [],
      })

      await caller.events.create({
        projectId,
        title: "Meeting 1",
        date: new Date("2025-10-21"),
        categoryId: "meeting",
        relatedContactIds: [contact1Id],
      })

      await caller.events.create({
        projectId,
        title: "Inspection 1",
        date: new Date("2025-10-22"),
        categoryId: "inspection",
        relatedContactIds: [contact2Id],
      })
    })

    test("lists all events for project", async () => {
      const result = await caller.events.list({ projectId })

      expect(result.events).toHaveLength(3)
      expect(result.events[0]!.title).toBe("Inspection 1") // Newest first
    })

    test("filters events by category", async () => {
      const result = await caller.events.list({
        projectId,
        categoryId: "milestone",
      })

      expect(result.events).toHaveLength(1)
      expect(result.events[0]!.categoryId).toBe("milestone")
    })

    test("filters events by contact", async () => {
      const result = await caller.events.list({
        projectId,
        contactId: contact1Id,
      })

      expect(result.events).toHaveLength(1)
      expect(result.events[0]!.title).toBe("Meeting 1")
    })

    test("filters events by date range", async () => {
      const result = await caller.events.list({
        projectId,
        startDate: new Date("2025-10-21"),
        endDate: new Date("2025-10-22"),
      })

      expect(result.events).toHaveLength(2)
      expect(result.events.map((e) => e.title)).toContain("Meeting 1")
      expect(result.events.map((e) => e.title)).toContain("Inspection 1")
    })

    test("returns empty list for project with no events", async () => {
      const newProject = await caller.projects.create({
        name: "Empty Project",
        address: {
          streetNumber: "456",
          streetName: "Test Ave",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
          formatted: "456 Test Ave, Melbourne VIC 3000",
        },
        startDate: new Date(),
        projectType: "new_build",
      })

      const result = await caller.events.list({ projectId: newProject.id })

      expect(result.events).toHaveLength(0)
    })

    test("rejects listing for unauthorized user", async () => {
      await expect(otherCaller.events.list({ projectId })).rejects.toThrow("FORBIDDEN")
    })
  })

  describe("update", () => {
    let eventId: string

    beforeEach(async () => {
      const event = await caller.events.create({
        projectId,
        title: "Original Title",
        description: "Original description",
        date: new Date("2025-10-20"),
        categoryId: "milestone",
        relatedContactIds: [contact1Id],
      })
      eventId = event.id
    })

    test("updates event title and description", async () => {
      const updated = await caller.events.update({
        id: eventId,
        title: "Updated Title",
        description: "Updated description",
      })

      expect(updated).toMatchObject({
        title: "Updated Title",
        description: "Updated description",
      })
    })

    test("updates event date and category", async () => {
      const newDate = new Date("2025-10-25")
      const updated = await caller.events.update({
        id: eventId,
        date: newDate,
        categoryId: "inspection",
      })

      expect(updated.categoryId).toBe("inspection")
      expect(updated.date.toISOString()).toBe(newDate.toISOString())
    })

    test("updates related contacts", async () => {
      await caller.events.update({
        id: eventId,
        relatedContactIds: [contact2Id],
      })

      const result = await caller.events.list({ projectId })
      const updatedEvent = result.events.find((e) => e.id === eventId)

      expect(updatedEvent?.eventContacts).toHaveLength(1)
      expect(updatedEvent?.eventContacts[0]!.contact.id).toBe(contact2Id)
    })

    test("removes all contacts when empty array provided", async () => {
      await caller.events.update({
        id: eventId,
        relatedContactIds: [],
      })

      const result = await caller.events.list({ projectId })
      const updatedEvent = result.events.find((e) => e.id === eventId)

      expect(updatedEvent?.eventContacts).toHaveLength(0)
    })

    test("rejects update for non-existent event", async () => {
      await expect(
        caller.events.update({
          id: "non-existent-event",
          title: "Updated Title",
        })
      ).rejects.toThrow()
    })

    test("rejects update for unauthorized user", async () => {
      await expect(
        otherCaller.events.update({
          id: eventId,
          title: "Unauthorized Update",
        })
      ).rejects.toThrow("FORBIDDEN")
    })
  })

  describe("delete", () => {
    let eventId: string

    beforeEach(async () => {
      const event = await caller.events.create({
        projectId,
        title: "Event to Delete",
        date: new Date("2025-10-20"),
        categoryId: "milestone",
        relatedContactIds: [],
      })
      eventId = event.id
    })

    test("soft deletes event", async () => {
      const result = await caller.events.delete(eventId)

      expect(result.success).toBe(true)

      // Event should not appear in list
      const eventsList = await caller.events.list({ projectId })
      expect(eventsList.events.find((e) => e.id === eventId)).toBeUndefined()
    })

    test("rejects delete for non-existent event", async () => {
      await expect(caller.events.delete("non-existent-event")).rejects.toThrow()
    })

    test("rejects delete for unauthorized user", async () => {
      await expect(otherCaller.events.delete(eventId)).rejects.toThrow("FORBIDDEN")
    })
  })

  describe("junction table operations", () => {
    test("prevents duplicate contact links", async () => {
      const event = await caller.events.create({
        projectId,
        title: "Test Event",
        date: new Date(),
        categoryId: "meeting",
        relatedContactIds: [contact1Id, contact1Id], // Duplicate
      })

      const result = await caller.events.list({ projectId })
      const createdEvent = result.events.find((e) => e.id === event.id)

      // Should only have one unique contact link
      expect(createdEvent?.eventContacts).toHaveLength(1)
    })

    test("handles contact deletion cascade", async () => {
      const event = await caller.events.create({
        projectId,
        title: "Test Event",
        date: new Date(),
        categoryId: "meeting",
        relatedContactIds: [contact1Id],
      })

      // Delete the contact
      await caller.contacts.delete(contact1Id)

      // Event should still exist but without the contact
      const result = await caller.events.list({ projectId })
      const updatedEvent = result.events.find((e) => e.id === event.id)

      expect(updatedEvent).toBeDefined()
      // Contact link should be gone (cascade delete)
      expect(updatedEvent?.eventContacts).toHaveLength(0)
    })
  })
})
