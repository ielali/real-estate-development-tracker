import { describe, it, expect, beforeEach, afterEach } from "vitest"
import bcrypt from "bcryptjs"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

describe("Authentication", () => {
  beforeEach(async () => {
    await db.delete(users)
  })

  afterEach(async () => {
    await db.delete(users)
  })

  describe("User Registration", () => {
    it("should hash password before storing", async () => {
      const userData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "password123",
        role: "admin" as const,
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10)

      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning()

      expect(user.password).not.toBe(userData.password)
      expect(await bcrypt.compare(userData.password, user.password)).toBe(true)
    })

    it("should create user with admin role", async () => {
      const userData = {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        password: await bcrypt.hash("password123", 10),
        role: "admin" as const,
      }

      const [user] = await db.insert(users).values(userData).returning()

      expect(user.role).toBe("admin")
      expect(user.email).toBe(userData.email)
      expect(user.firstName).toBe(userData.firstName)
      expect(user.lastName).toBe(userData.lastName)
    })

    it("should prevent duplicate email registration", async () => {
      const userData = {
        email: "duplicate@example.com",
        firstName: "Test",
        lastName: "User",
        password: await bcrypt.hash("password123", 10),
        role: "admin" as const,
      }

      await db.insert(users).values(userData)

      await expect(() => db.insert(users).values(userData)).rejects.toThrow()
    })
  })

  describe("Password Validation", () => {
    it("should validate correct password", async () => {
      const plainPassword = "password123"
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const isValid = await bcrypt.compare(plainPassword, hashedPassword)
      expect(isValid).toBe(true)
    })

    it("should reject incorrect password", async () => {
      const plainPassword = "password123"
      const wrongPassword = "wrongpassword"
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe("User Lookup", () => {
    it("should find user by email", async () => {
      const userData = {
        email: "lookup@example.com",
        firstName: "Lookup",
        lastName: "User",
        password: await bcrypt.hash("password123", 10),
        role: "partner" as const,
      }

      await db.insert(users).values(userData)

      const foundUsers = await db.select().from(users).where(eq(users.email, userData.email))

      expect(foundUsers).toHaveLength(1)
      expect(foundUsers[0].email).toBe(userData.email)
    })

    it("should return empty array for non-existent email", async () => {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, "nonexistent@example.com"))

      expect(foundUsers).toHaveLength(0)
    })
  })
})
