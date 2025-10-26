/**
 * Authorization RBAC Tests
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Tests for role-based middleware, permission-aware queries, and audit logging.
 */

import { describe, it, expect } from "vitest"
import { appRouter } from "../root"
import { createTestContext } from "@/test/test-db"
import { TRPCError } from "@trpc/server"
import {
  requireAdmin,
  requireRole,
  getAccessibleProjects,
  verifyProjectAccess,
  assertProjectOwner,
} from "../helpers/authorization"
import { projectAccess, auditLog } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"

describe("Authorization RBAC - Story 4.2", () => {
  describe("requireAdmin middleware", () => {
    it("allows admin users", async () => {
      const ctx = await createTestContext({ role: "admin" })

      expect(() => requireAdmin(ctx)).not.toThrow()
    })

    it("blocks partner users", async () => {
      const ctx = await createTestContext({ role: "partner" })

      expect(() => requireAdmin(ctx)).toThrow(TRPCError)
      expect(() => requireAdmin(ctx)).toThrow(/admin privileges/)
    })

    it("blocks unauthenticated users", async () => {
      const ctx = await createTestContext({ user: null })

      expect(() => requireAdmin(ctx)).toThrow(TRPCError)
      expect(() => requireAdmin(ctx)).toThrow(/logged in/)
    })
  })

  describe("requireRole middleware", () => {
    it("allows users with matching role", async () => {
      const adminCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })

      expect(() => requireRole(adminCtx, ["admin"])).not.toThrow()
      expect(() => requireRole(partnerCtx, ["partner"])).not.toThrow()
      expect(() => requireRole(adminCtx, ["admin", "partner"])).not.toThrow()
      expect(() => requireRole(partnerCtx, ["admin", "partner"])).not.toThrow()
    })

    it("blocks users without matching role", async () => {
      const partnerCtx = await createTestContext({ role: "partner" })

      expect(() => requireRole(partnerCtx, ["admin"])).toThrow(TRPCError)
      expect(() => requireRole(partnerCtx, ["admin"])).toThrow(/requires one of/)
    })
  })

  describe("getAccessibleProjects", () => {
    it("returns owned projects for admin", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create owned project
      const ownedProject = await caller.projects.create({
        name: "My Project",
        address: {
          streetNumber: "123",
          streetName: "Main St",
          suburb: "Sydney",
          state: "NSW",
          postcode: "2000",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      const accessibleProjects = await getAccessibleProjects(ctx)

      expect(accessibleProjects).toHaveLength(1)
      expect(accessibleProjects[0].project.id).toBe(ownedProject.id)
      expect(accessibleProjects[0].access).toBe("owner")
      expect(accessibleProjects[0].permission).toBe("write")
    })

    it("returns partner projects with accepted invitations", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Shared Project",
        address: {
          streetNumber: "456",
          streetName: "Partner St",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3000",
        },
        projectType: "new_build",
        startDate: new Date(),
      })

      // Manually create accepted partner access (simulating invitation flow)
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "read",
        invitedAt: new Date(),
        acceptedAt: new Date(), // Accepted invitation
        invitedBy: ownerCtx.user!.id,
        invitationToken: null,
        expiresAt: null,
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const accessibleProjects = await getAccessibleProjects(partnerCtx)

      expect(accessibleProjects).toHaveLength(1)
      expect(accessibleProjects[0].project.id).toBe(project.id)
      expect(accessibleProjects[0].access).toBe("partner")
      expect(accessibleProjects[0].permission).toBe("read")
    })

    it("excludes projects with pending invitations", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Pending Project",
        address: {
          streetNumber: "789",
          streetName: "Pending Rd",
          suburb: "Brisbane",
          state: "QLD",
          postcode: "4000",
        },
        projectType: "maintenance",
        startDate: new Date(),
      })

      // Create pending invitation (no acceptedAt)
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "write",
        invitedAt: new Date(),
        acceptedAt: null, // NOT accepted
        invitedBy: ownerCtx.user!.id,
        invitationToken: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const accessibleProjects = await getAccessibleProjects(partnerCtx)

      expect(accessibleProjects).toHaveLength(0)
    })
  })

  describe("verifyProjectAccess with audit logging", () => {
    it("logs successful owner access", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create project
      const project = await caller.projects.create({
        name: "Audit Test Project",
        address: {
          streetNumber: "111",
          streetName: "Audit St",
          suburb: "Perth",
          state: "WA",
          postcode: "6000",
        },
        projectType: "development",
        startDate: new Date(),
      })

      // Access project (should log)
      await verifyProjectAccess(ctx, project.id, "read")

      // Verify audit log
      const logs = await ctx.db
        .select()
        .from(auditLog)
        .where(eq(auditLog.entityId, project.id))
        .orderBy(desc(auditLog.timestamp))
        .limit(1)

      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe("accessed")
      expect(logs[0].entityType).toBe("project")

      const metadata = JSON.parse(logs[0].metadata || "{}")
      expect(metadata.success).toBe(true)
      expect(metadata.permission).toBe("owner")
    })

    it("logs failed access attempts", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Forbidden Project",
        address: {
          streetNumber: "222",
          streetName: "Forbidden Ave",
          suburb: "Adelaide",
          state: "SA",
          postcode: "5000",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Try to access as different user (should fail and log)
      await expect(verifyProjectAccess(partnerCtx, project.id, "read")).rejects.toThrow(TRPCError)

      // Verify failed access was logged
      const logs = await partnerCtx.db
        .select()
        .from(auditLog)
        .where(eq(auditLog.entityId, project.id))
        .orderBy(desc(auditLog.timestamp))
        .limit(1)

      expect(logs).toHaveLength(1)
      expect(logs[0].userId).toBe(partnerCtx.user!.id)

      const metadata = JSON.parse(logs[0].metadata || "{}")
      expect(metadata.success).toBe(false)
      expect(metadata.reason).toContain("does not have access")
    })
  })

  describe("assertProjectOwner", () => {
    it("allows owner access", async () => {
      const ctx = await createTestContext({ role: "admin" })
      const caller = appRouter.createCaller(ctx)

      // Create project
      const project = await caller.projects.create({
        name: "Owner Test",
        address: {
          streetNumber: "333",
          streetName: "Owner Rd",
          suburb: "Hobart",
          state: "TAS",
          postcode: "7000",
        },
        projectType: "new_build",
        startDate: new Date(),
      })

      const access = await verifyProjectAccess(ctx, project.id, "read")

      expect(() => assertProjectOwner(access, "test operation")).not.toThrow()
    })

    it("blocks partner access even with write permission", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)

      // Create project
      const project = await ownerCaller.projects.create({
        name: "Partner Blocked",
        address: {
          streetNumber: "444",
          streetName: "Block St",
          suburb: "Darwin",
          state: "NT",
          postcode: "0800",
        },
        projectType: "maintenance",
        startDate: new Date(),
      })

      // Create accepted partner access with WRITE permission
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "write",
        invitedAt: new Date(),
        acceptedAt: new Date(),
        invitedBy: ownerCtx.user!.id,
        invitationToken: null,
        expiresAt: null,
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const access = await verifyProjectAccess(partnerCtx, project.id, "write")

      // Partner has write permission but should NOT be able to perform owner-only operations
      expect(access.access).toBe("partner")
      expect(access.permission).toBe("write")
      expect(() => assertProjectOwner(access, "delete project")).toThrow(TRPCError)
      expect(() => assertProjectOwner(access, "delete project")).toThrow(/Only project owners/)
    })
  })

  describe("Project router RBAC integration", () => {
    it("allows partners to view assigned projects", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Shared View Test",
        address: {
          streetNumber: "555",
          streetName: "View St",
          suburb: "Canberra",
          state: "ACT",
          postcode: "2600",
        },
        projectType: "renovation",
        startDate: new Date(),
      })

      // Grant read access to partner
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "read",
        invitedAt: new Date(),
        acceptedAt: new Date(),
        invitedBy: ownerCtx.user!.id,
        invitationToken: null,
        expiresAt: null,
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Partner should be able to view project
      const viewedProject = await partnerCaller.projects.getById({ id: project.id })

      expect(viewedProject.id).toBe(project.id)
      expect(viewedProject.userPermission).toBe("read")
      expect(viewedProject.access).toBe("partner")
    })

    it("blocks partners from updating projects", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Update Block Test",
        address: {
          streetNumber: "666",
          streetName: "Update Ave",
          suburb: "Sydney",
          state: "NSW",
          postcode: "2001",
        },
        projectType: "development",
        startDate: new Date(),
      })

      // Grant write access to partner
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "write",
        invitedAt: new Date(),
        acceptedAt: new Date(),
        invitedBy: ownerCtx.user!.id,
        invitationToken: null,
        expiresAt: null,
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Partner should NOT be able to update project (owner-only operation)
      await expect(
        partnerCaller.projects.update({
          id: project.id,
          name: "Hacked Name",
        })
      ).rejects.toThrow(TRPCError)
      await expect(
        partnerCaller.projects.update({
          id: project.id,
          name: "Hacked Name",
        })
      ).rejects.toThrow(/Only project owners/)
    })

    it("blocks partners from deleting projects", async () => {
      const ownerCtx = await createTestContext({ role: "admin" })
      const partnerCtx = await createTestContext({ role: "partner" })
      const ownerCaller = appRouter.createCaller(ownerCtx)
      const partnerCaller = appRouter.createCaller(partnerCtx)

      // Create project as owner
      const project = await ownerCaller.projects.create({
        name: "Delete Block Test",
        address: {
          streetNumber: "777",
          streetName: "Delete Rd",
          suburb: "Melbourne",
          state: "VIC",
          postcode: "3001",
        },
        projectType: "maintenance",
        startDate: new Date(),
      })

      // Grant write access to partner
      await ownerCtx.db.insert(projectAccess).values({
        id: crypto.randomUUID(),
        projectId: project.id,
        userId: partnerCtx.user!.id,
        permission: "write",
        invitedAt: new Date(),
        acceptedAt: new Date(),
        invitedBy: ownerCtx.user!.id,
        invitationToken: null,
        expiresAt: null,
        invitedEmail: partnerCtx.user!.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Partner should NOT be able to delete project
      await expect(partnerCaller.projects.softDelete({ id: project.id })).rejects.toThrow(TRPCError)
      await expect(partnerCaller.projects.softDelete({ id: project.id })).rejects.toThrow(
        /Only project owners/
      )
    })
  })
})
