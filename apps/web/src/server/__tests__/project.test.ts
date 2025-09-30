import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { appRouter } from "../api/root"
import { createTestDb } from "@/test/test-db"
import type { User } from "../db/schema/users"
import { users } from "../db/schema/users"

/**
 * Project Router Tests
 *
 * Tests all CRUD operations for projects including:
 * - Creating projects with valid data
 * - Listing user's projects
 * - Getting project by ID
 * - Updating projects
 * - Soft deleting projects
 * - Access control (users can only access their own projects)
 */
describe("Project Router", () => {
  let testDbInstance: ReturnType<typeof createTestDb>
  let testUser: User
  let anotherUser: User

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

  beforeEach(async () => {
    // Create fresh test database
    testDbInstance = createTestDb()

    // Create test users
    const [user1] = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-1",
        email: "testuser@example.com",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
      })
      .returning()

    const [user2] = await testDbInstance.db
      .insert(users)
      .values({
        id: "test-user-2",
        email: "anotheruser@example.com",
        name: "Another User",
        firstName: "Another",
        lastName: "User",
      })
      .returning()

    testUser = user1!
    anotherUser = user2!
  })

  afterEach(() => {
    // Clean up test database
    testDbInstance.cleanup()
  })

  describe("create", () => {
    it("creates a project with valid input", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      const result = await caller.projects.create({
        name: "Test Project",
        description: "A test project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: "Street",
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date("2024-01-01"),
        endDate: null,
        totalBudget: 100000,
      })

      expect(result).toMatchObject({
        name: "Test Project",
        description: "A test project",
        ownerId: testUser.id,
        projectType: "renovation",
        status: "planning",
      })
      expect(result.id).toBeTruthy()
      expect(result.addressId).toBeTruthy()
    })

    it("requires name field", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.projects.create({
          name: "",
          address: {
            streetNumber: "123",
            streetName: "Main",
            streetType: null,
            suburb: "Sydney",
            state: "NSW",
            postcode: "2000",
            country: "Australia",
          },
          projectType: "renovation",
          startDate: new Date(),
        } as never)
      ).rejects.toThrow()
    })

    it("validates postcode format", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.projects.create({
          name: "Test Project",
          address: {
            streetNumber: "123",
            streetName: "Main",
            streetType: null,
            suburb: "Sydney",
            state: "NSW",
            postcode: "200", // Invalid: only 3 digits
            country: "Australia",
          },
          projectType: "renovation",
          startDate: new Date(),
        })
      ).rejects.toThrow()
    })
  })

  describe("list", () => {
    it("returns only user's projects", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      // Create project for test user
      await caller.projects.create({
        name: "User 1 Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Create project for another user
      const anotherCtx = {
        ...ctx,
        session: {
          user: anotherUser,
          session: createMockSession(anotherUser.id),
        },
        user: anotherUser,
      }
      const anotherCaller = appRouter.createCaller(anotherCtx)
      await anotherCaller.projects.create({
        name: "User 2 Project",
        address: {
          streetNumber: "456",
          streetName: "Other",
          streetType: null,
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
        projectType: "new_build",
        startDate: new Date(),
      })

      // List projects for first user
      const projects = await caller.projects.list()

      expect(projects).toHaveLength(1)
      expect(projects[0]?.name).toBe("User 1 Project")
    })

    it("excludes soft-deleted projects", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      // Create two projects
      const project1 = await caller.projects.create({
        name: "Active Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      const project2 = await caller.projects.create({
        name: "Deleted Project",
        address: {
          streetNumber: "456",
          streetName: "Other",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Soft delete one project
      await caller.projects.softDelete({ id: project2.id })

      // List should only return active project
      const projects = await caller.projects.list()
      expect(projects).toHaveLength(1)
      expect(projects[0]?.id).toBe(project1.id)
    })
  })

  describe("getById", () => {
    it("returns project by ID for owner", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      const created = await caller.projects.create({
        name: "Test Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      const fetched = await caller.projects.getById({ id: created.id })

      expect(fetched.id).toBe(created.id)
      expect(fetched.name).toBe("Test Project")
      expect(fetched.address).toBeTruthy()
    })

    it("throws error when accessing another user's project", async () => {
      const ctx1 = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller1 = appRouter.createCaller(ctx1)

      const project = await caller1.projects.create({
        name: "User 1 Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Try to access with another user
      const ctx2 = {
        ...ctx1,
        session: {
          user: anotherUser,
          session: createMockSession(anotherUser.id),
        },
        user: anotherUser,
      }
      const caller2 = appRouter.createCaller(ctx2)

      await expect(caller2.projects.getById({ id: project.id })).rejects.toThrow()
    })
  })

  describe("update", () => {
    it("updates project successfully", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      const created = await caller.projects.create({
        name: "Original Name",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      const updated = await caller.projects.update({
        id: created.id,
        name: "Updated Name",
        status: "active",
      })

      expect(updated.name).toBe("Updated Name")
      expect(updated.status).toBe("active")
    })

    it("prevents updating another user's project", async () => {
      const ctx1 = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller1 = appRouter.createCaller(ctx1)

      const project = await caller1.projects.create({
        name: "User 1 Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Try to update with another user
      const ctx2 = {
        ...ctx1,
        session: {
          user: anotherUser,
          session: createMockSession(anotherUser.id),
        },
        user: anotherUser,
      }
      const caller2 = appRouter.createCaller(ctx2)

      await expect(
        caller2.projects.update({
          id: project.id,
          name: "Hacked Name",
        })
      ).rejects.toThrow()
    })
  })

  describe("softDelete", () => {
    it("soft deletes project successfully", async () => {
      const ctx = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller = appRouter.createCaller(ctx)

      const project = await caller.projects.create({
        name: "To Delete",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      await caller.projects.softDelete({ id: project.id })

      // Project should not appear in list
      const projects = await caller.projects.list()
      expect(projects.find((p) => p.id === project.id)).toBeUndefined()

      // Getting by ID should also fail
      await expect(caller.projects.getById({ id: project.id })).rejects.toThrow()
    })

    it("prevents deleting another user's project", async () => {
      const ctx1 = {
        headers: new Headers(),
        db: testDbInstance.db,
        session: {
          user: testUser,
          session: createMockSession(testUser.id),
        },
        user: testUser,
      }

      const caller1 = appRouter.createCaller(ctx1)

      const project = await caller1.projects.create({
        name: "User 1 Project",
        address: {
          streetNumber: "123",
          streetName: "Main",
          streetType: null,
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Try to delete with another user
      const ctx2 = {
        ...ctx1,
        session: {
          user: anotherUser,
          session: createMockSession(anotherUser.id),
        },
        user: anotherUser,
      }
      const caller2 = appRouter.createCaller(ctx2)

      await expect(caller2.projects.softDelete({ id: project.id })).rejects.toThrow()
    })
  })
})
