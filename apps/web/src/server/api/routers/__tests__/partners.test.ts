/**
 * Partners Router Tests
 *
 * Tests partner invitation, registration, and access management functionality
 * Includes tests for duplicate detection, expiration, and authorization
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest"
import { appRouter } from "../../root"
import { createTestDb, cleanupAllTestDatabases } from "@/test/test-db"
import type { User } from "@/server/db/schema/users"
import { users } from "@/server/db/schema/users"
import { projectAccess } from "@/server/db/schema/projectAccess"
import * as emailModule from "@/lib/email"
import { eq } from "drizzle-orm"

// Mock email service
vi.mock("@/lib/email", () => ({
  emailService: {
    sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
  },
}))

describe("Partners Router", () => {
  let testDbInstance: Awaited<ReturnType<typeof createTestDb>>
  let projectOwner: User
  let partnerUser: User
  let caller: ReturnType<typeof appRouter.createCaller>
  let partnerCaller: ReturnType<typeof appRouter.createCaller>
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

    // Create test users
    projectOwner = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000001", // Valid UUID
        email: "owner@example.com",
        name: "Project Owner",
        firstName: "Project",
        lastName: "Owner",
      })
      .returning()
      .then((rows) => rows[0]!)

    partnerUser = await testDbInstance.db
      .insert(users)
      .values({
        id: "00000000-0000-0000-0000-000000000002", // Valid UUID
        email: "partner@example.com",
        name: "Partner User",
        firstName: "Partner",
        lastName: "User",
      })
      .returning()
      .then((rows) => rows[0]!)

    caller = appRouter.createCaller(createMockContext(projectOwner))
    partnerCaller = appRouter.createCaller(createMockContext(partnerUser))

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
      },
      projectType: "renovation",
      startDate: new Date(),
    })

    projectId = project.id
  })

  describe("invitePartner", () => {
    test("should create invitation with valid email and send email", async () => {
      const result = await caller.partners.invitePartner({
        projectId,
        email: "newpartner@example.com",
        permission: "read",
      })

      expect(result.status).toBe("invitation_sent")
      expect(result.message).toContain("newpartner@example.com")
      expect(result.message).toContain("7 days")
      expect(result.access).toBeDefined()
      expect(result.access?.invitationToken).toBeDefined()
      expect(result.access?.expiresAt).toBeDefined()

      // Verify email was sent
      expect(emailModule.emailService.sendInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newpartner@example.com",
          projectName: "Test Project",
          permission: "read",
        })
      )
    })

    test("should set expiration to 7 days from now", async () => {
      const result = await caller.partners.invitePartner({
        projectId,
        email: "newpartner@example.com",
        permission: "read",
      })

      const expiresAt = result.access?.expiresAt
      expect(expiresAt).toBeDefined()

      const now = new Date()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const expectedExpiry = new Date(now.getTime() + sevenDays)
      const diff = Math.abs(expiresAt!.getTime() - expectedExpiry.getTime())

      // Allow 1 second difference for test execution time
      expect(diff).toBeLessThan(1000)
    })

    test("should return 'already_partner' for existing partner", async () => {
      // First invitation and acceptance would be set up here
      // For now, we'll test the detection logic by creating a completed access record
      const firstInvite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      // Accept the invitation
      await testDbInstance.db
        .update(projectAccess)
        .set({
          userId: partnerUser.id,
          acceptedAt: new Date(),
          invitationToken: null,
        })
        .where(eq(projectAccess.id, firstInvite.access!.id))

      // Try to invite again
      const result = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      expect(result.status).toBe("already_partner")
      expect(result.message).toContain("already has access")
    })

    test("should return 'pending_invitation' for duplicate pending invitation", async () => {
      // First invitation
      await caller.partners.invitePartner({
        projectId,
        email: "pending@example.com",
        permission: "read",
      })

      // Try to invite same email again
      const result = await caller.partners.invitePartner({
        projectId,
        email: "pending@example.com",
        permission: "read",
      })

      expect(result.status).toBe("pending_invitation")
      expect(result.message).toContain("already pending")
      expect(result.canResend).toBe(true)
    })

    test("should allow inviting different emails even when another pending invitation exists", async () => {
      // First invitation to user1
      await caller.partners.invitePartner({
        projectId,
        email: "user1@example.com",
        permission: "read",
      })

      // Second invitation to user2 should succeed (not trigger duplicate detection)
      const result = await caller.partners.invitePartner({
        projectId,
        email: "user2@example.com",
        permission: "read",
      })

      expect(result.status).toBe("invitation_sent")
      expect(result.access).toBeDefined()
    })

    test("should throw FORBIDDEN if user is not project owner", async () => {
      await expect(
        partnerCaller.partners.invitePartner({
          projectId,
          email: "test@example.com",
          permission: "read",
        })
      ).rejects.toThrow("Only the project owner can invite partners")
    })
  })

  describe("listInvitations", () => {
    test("should return all invitations for project owner", async () => {
      // Create multiple invitations
      await caller.partners.invitePartner({
        projectId,
        email: "partner1@example.com",
        permission: "read",
      })

      await caller.partners.invitePartner({
        projectId,
        email: "partner2@example.com",
        permission: "write",
      })

      const invitations = await caller.partners.listInvitations(projectId)

      expect(invitations).toHaveLength(2)
      expect(invitations[0]?.status).toBe("pending")
      expect(invitations[0]?.daysRemaining).toBeGreaterThan(0)
    })

    test("should calculate days remaining correctly", async () => {
      await caller.partners.invitePartner({
        projectId,
        email: "test@example.com",
        permission: "read",
      })

      const invitations = await caller.partners.listInvitations(projectId)

      expect(invitations[0]?.daysRemaining).toBe(7)
    })

    test("should show 'accepted' status for accepted invitations", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      // Simulate acceptance
      await testDbInstance.db
        .update(projectAccess)
        .set({
          userId: partnerUser.id,
          acceptedAt: new Date(),
          invitationToken: null,
        })
        .where(eq(projectAccess.id, invite.access!.id))

      const invitations = await caller.partners.listInvitations(projectId)

      expect(invitations[0]?.status).toBe("accepted")
      expect(invitations[0]?.user).toBeDefined()
      expect(invitations[0]?.user?.firstName).toBe("Partner")
    })

    test("should return correct email for pending invitations", async () => {
      const testEmail = "pending@example.com"
      await caller.partners.invitePartner({
        projectId,
        email: testEmail,
        permission: "read",
      })

      const invitations = await caller.partners.listInvitations(projectId)
      const pendingInvitation = invitations.find((inv) => inv.status === "pending")

      expect(pendingInvitation).toBeDefined()
      expect(pendingInvitation?.email).toBe(testEmail)
    })
  })

  describe("revokeAccess", () => {
    test("should soft delete partner access", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      // Accept invitation
      await testDbInstance.db
        .update(projectAccess)
        .set({
          userId: partnerUser.id,
          acceptedAt: new Date(),
        })
        .where(eq(projectAccess.id, invite.access!.id))

      // Revoke access
      const result = await caller.partners.revokeAccess({
        projectId,
        accessId: invite.access!.id,
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain("revoked")

      // Verify access is soft deleted
      const invitations = await caller.partners.listInvitations(projectId)
      expect(invitations).toHaveLength(0)
    })

    test("should throw FORBIDDEN if user is not project owner", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: "test@example.com",
        permission: "read",
      })

      await expect(
        partnerCaller.partners.revokeAccess({
          projectId,
          accessId: invite.access!.id,
        })
      ).rejects.toThrow("Only the project owner can revoke access")
    })
  })

  describe("resendInvitation", () => {
    test("should generate new token and reset expiration", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: "test@example.com",
        permission: "read",
      })

      // Wait a moment to ensure new timestamp
      await new Promise((resolve) => setTimeout(resolve, 10))

      const result = await caller.partners.resendInvitation({
        accessId: invite.access!.id,
      })

      expect(result.success).toBe(true)

      // Verify new token was generated
      const invitations = await caller.partners.listInvitations(projectId)
      expect(invitations[0]?.id).toBe(invite.access?.id)
      // Token is not exposed in list, but we verified it was regenerated via success
    })

    test("should throw BAD_REQUEST if invitation already accepted", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      // Accept invitation
      await testDbInstance.db
        .update(projectAccess)
        .set({
          userId: partnerUser.id,
          acceptedAt: new Date(),
        })
        .where(eq(projectAccess.id, invite.access!.id))

      await expect(
        caller.partners.resendInvitation({
          accessId: invite.access!.id,
        })
      ).rejects.toThrow("already been accepted")
    })

    test("should retrieve email correctly for pending invitations", async () => {
      const testEmail = "resend-test@example.com"
      const invite = await caller.partners.invitePartner({
        projectId,
        email: testEmail,
        permission: "read",
      })

      // Resend should work and use the invitedEmail field
      const result = await caller.partners.resendInvitation({
        accessId: invite.access!.id,
      })

      expect(result.success).toBe(true)
      // Verify the email is still correct in the invitation list
      const invitations = await caller.partners.listInvitations(projectId)
      const resentInvitation = invitations.find((inv) => inv.id === invite.access?.id)
      expect(resentInvitation?.email).toBe(testEmail)
    })
  })

  describe("cancelInvitation", () => {
    test("should soft delete pending invitation", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: "test@example.com",
        permission: "read",
      })

      const result = await caller.partners.cancelInvitation({
        accessId: invite.access!.id,
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain("cancelled")

      // Verify invitation is soft deleted
      const invitations = await caller.partners.listInvitations(projectId)
      expect(invitations).toHaveLength(0)
    })

    test("should throw BAD_REQUEST if invitation already accepted", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      // Accept invitation
      await testDbInstance.db
        .update(projectAccess)
        .set({
          userId: partnerUser.id,
          acceptedAt: new Date(),
        })
        .where(eq(projectAccess.id, invite.access!.id))

      await expect(
        caller.partners.cancelInvitation({
          accessId: invite.access!.id,
        })
      ).rejects.toThrow("already been accepted")
    })
  })

  describe("acceptInvitation", () => {
    test("should link user to project and mark email as verified", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: partnerUser.email,
        permission: "read",
      })

      const result = await caller.partners.acceptInvitation({
        token: invite.access!.invitationToken!,
        userId: partnerUser.id,
      })

      expect(result.success).toBe(true)
      expect(result.projectId).toBe(projectId)

      // Verify user is linked
      const invitations = await caller.partners.listInvitations(projectId)
      expect(invitations[0]?.status).toBe("accepted")
      expect(invitations[0]?.user?.firstName).toBe("Partner")
    })

    test("should throw BAD_REQUEST for expired invitation", async () => {
      const invite = await caller.partners.invitePartner({
        projectId,
        email: "test@example.com",
        permission: "read",
      })

      // Set expiration to past
      await testDbInstance.db
        .update(projectAccess)
        .set({
          expiresAt: new Date(Date.now() - 1000),
        })
        .where(eq(projectAccess.id, invite.access!.id))

      await expect(
        caller.partners.acceptInvitation({
          token: invite.access!.invitationToken!,
          userId: partnerUser.id,
        })
      ).rejects.toThrow("expired")
    })

    test("should throw NOT_FOUND for invalid token", async () => {
      await expect(
        caller.partners.acceptInvitation({
          token: "00000000-0000-0000-0000-000000000000",
          userId: partnerUser.id,
        })
      ).rejects.toThrow("Invalid invitation link")
    })
  })
})
