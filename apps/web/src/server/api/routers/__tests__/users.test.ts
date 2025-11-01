import { describe, test, expect } from "vitest"
import { appRouter } from "@/server/api/root"
import { createTestContext } from "@/test/test-db"

describe("usersRouter", () => {
  describe("updateProfile", () => {
    test("updates user first name and last name", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const result = await caller.users.updateProfile({
        firstName: "Jane",
        lastName: "Smith",
      })

      expect(result).toMatchObject({
        firstName: "Jane",
        lastName: "Smith",
        name: "Jane Smith",
        email: ctx.user.email,
      })
    })

    test("generates full name from first and last name", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const result = await caller.users.updateProfile({
        firstName: "John",
        lastName: "Doe",
      })

      expect(result.name).toBe("John Doe")
    })

    test("validates first name is required", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.users.updateProfile({
          firstName: "",
          lastName: "Smith",
        })
      ).rejects.toThrow()
    })

    test("validates last name is required", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      await expect(
        caller.users.updateProfile({
          firstName: "Jane",
          lastName: "",
        })
      ).rejects.toThrow()
    })
  })

  describe("getProfile", () => {
    test("returns current user profile", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const result = await caller.users.getProfile()

      expect(result).toMatchObject({
        id: ctx.user.id,
        email: ctx.user.email,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        role: ctx.user.role,
      })
      expect(result).toHaveProperty("createdAt")
      expect(result).toHaveProperty("twoFactorEnabled")
    })

    test("includes email verification status", async () => {
      const ctx = await createTestContext()
      const caller = appRouter.createCaller(ctx)

      const result = await caller.users.getProfile()

      expect(result).toHaveProperty("emailVerified")
      expect(typeof result.emailVerified).toBe("boolean")
    })
  })
})
