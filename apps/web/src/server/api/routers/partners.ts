import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { projects } from "@/server/db/schema/projects"
import { users } from "@/server/db/schema/users"
import { auditLog } from "@/server/db/schema/auditLog"
import { emailService } from "@/lib/email"
import { randomUUID } from "crypto"
import { notifyPartnerInvited } from "@/server/services/notifications"

/**
 * Partners router with invitation and access management operations
 *
 * Provides type-safe API endpoints for inviting partners, managing
 * invitations, and controlling project access.
 */
export const partnersRouter = createTRPCRouter({
  /**
   * Invite a partner to a project via email
   *
   * Creates a secure invitation token, sends email, and handles
   * duplicate invitation scenarios.
   *
   * @throws {TRPCError} FORBIDDEN - User is not project owner
   * @throws {TRPCError} BAD_REQUEST - Duplicate invitation exists
   */
  invitePartner: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        email: z.string().email(),
        permission: z.enum(["read", "write"]).default("read"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { projectId, email, permission } = input
      const userId = ctx.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        })
      }

      // Verify user owns the project
      const project = await ctx.db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1)

      if (!project[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      if (project[0].ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can invite partners",
        })
      }

      // Check if user exists by email
      const existingUser = await ctx.db.select().from(users).where(eq(users.email, email)).limit(1)

      // Check for existing active access
      if (existingUser[0]) {
        const existingAccess = await ctx.db
          .select()
          .from(projectAccess)
          .where(
            and(
              eq(projectAccess.projectId, projectId),
              eq(projectAccess.userId, existingUser[0].id),
              isNull(projectAccess.deletedAt),
              isNotNull(projectAccess.acceptedAt)
            )
          )
          .limit(1)

        if (existingAccess[0]) {
          return {
            status: "already_partner" as const,
            message: "This person already has access to this project.",
            access: existingAccess[0],
          }
        }
      }

      // Check for pending invitation by email (no userId yet)
      const pendingInvitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(
          and(
            eq(projectAccess.projectId, projectId),
            eq(projectAccess.invitedEmail, email), // Filter by specific email to avoid false positives
            isNotNull(projectAccess.invitationToken),
            isNull(projectAccess.acceptedAt),
            isNull(projectAccess.deletedAt)
          )
        )
        .limit(1)

      if (pendingInvitation[0]) {
        return {
          status: "pending_invitation" as const,
          message: "An invitation is already pending.",
          accessId: pendingInvitation[0].id,
          canResend: true,
        }
      }

      // Check for revoked access
      if (existingUser[0]) {
        const revokedAccess = await ctx.db
          .select()
          .from(projectAccess)
          .where(
            and(
              eq(projectAccess.projectId, projectId),
              eq(projectAccess.userId, existingUser[0].id),
              isNotNull(projectAccess.deletedAt)
            )
          )
          .limit(1)

        if (revokedAccess[0]) {
          // Allow reinvitation by creating new record
          const invitationToken = randomUUID()
          const now = new Date()
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

          const [newInvitation] = await ctx.db
            .insert(projectAccess)
            .values({
              id: randomUUID(),
              projectId,
              userId: null, // Pending acceptance
              invitedEmail: email, // Store email for pending invitations
              permission,
              invitedAt: now,
              invitedBy: userId,
              invitationToken,
              expiresAt,
              createdAt: now,
              updatedAt: now,
            })
            .returning()

          // Get inviter details for email
          const inviter = await ctx.db.select().from(users).where(eq(users.id, userId)).limit(1)

          // Send invitation email
          await emailService.sendInvitationEmail({
            email,
            projectName: project[0].name,
            inviterName: `${inviter[0]?.firstName} ${inviter[0]?.lastName}`,
            inviterEmail: inviter[0]?.email || "",
            permission,
            invitationToken,
            expiresAt,
          })

          // Create audit log
          await ctx.db.insert(auditLog).values({
            id: randomUUID(),
            entityType: "project_access",
            entityId: newInvitation.id,
            action: "create",
            userId,
            metadata: JSON.stringify({
              email,
              permission,
              reinvitation: true,
            }),
            timestamp: now,
          })

          // Send notification if user already exists (Story 8.1: AC #10, #11)
          if (existingUser[0]) {
            await notifyPartnerInvited({
              userId: existingUser[0].id,
              projectId,
              projectName: project[0].name,
              inviterName: `${inviter[0]?.firstName} ${inviter[0]?.lastName}`,
            })
          }

          return {
            status: "reinvite_sent" as const,
            message: "Invitation sent to previously revoked partner.",
            access: newInvitation,
          }
        }
      }

      // Create new invitation
      const invitationToken = randomUUID()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const [newInvitation] = await ctx.db
        .insert(projectAccess)
        .values({
          id: randomUUID(),
          projectId,
          userId: null, // Pending acceptance
          invitedEmail: email, // Store email for pending invitations
          permission,
          invitedAt: now,
          invitedBy: userId,
          invitationToken,
          expiresAt,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      // Get inviter details for email
      const inviter = await ctx.db.select().from(users).where(eq(users.id, userId)).limit(1)

      // Send invitation email
      await emailService.sendInvitationEmail({
        email,
        projectName: project[0].name,
        inviterName: `${inviter[0]?.firstName} ${inviter[0]?.lastName}`,
        inviterEmail: inviter[0]?.email || "",
        permission,
        invitationToken,
        expiresAt,
      })

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        entityType: "project_access",
        entityId: newInvitation.id,
        action: "create",
        userId,
        metadata: JSON.stringify({
          email,
          permission,
        }),
        timestamp: now,
      })

      // Send notification if user already exists (Story 8.1: AC #10, #11)
      if (existingUser[0]) {
        await notifyPartnerInvited({
          userId: existingUser[0].id,
          projectId,
          projectName: project[0].name,
          inviterName: `${inviter[0]?.firstName} ${inviter[0]?.lastName}`,
        })
      }

      return {
        status: "invitation_sent" as const,
        message: `Invitation sent to ${email}. They have 7 days to accept.`,
        access: newInvitation,
      }
    }),

  /**
   * Get invitation details by token
   *
   * Returns invitation information for pre-populating registration form
   *
   * @throws {TRPCError} NOT_FOUND - Invalid invitation token
   * @throws {TRPCError} BAD_REQUEST - Invitation expired or already accepted
   */
  getInvitationDetails: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { token } = input

      // Find invitation by token with project and inviter details
      const invitation = await ctx.db
        .select({
          id: projectAccess.id,
          projectId: projectAccess.projectId,
          invitedEmail: projectAccess.invitedEmail,
          permission: projectAccess.permission,
          invitedAt: projectAccess.invitedAt,
          expiresAt: projectAccess.expiresAt,
          acceptedAt: projectAccess.acceptedAt,
          project: {
            id: projects.id,
            name: projects.name,
          },
          inviter: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(projectAccess)
        .leftJoin(projects, eq(projectAccess.projectId, projects.id))
        .leftJoin(users, eq(projectAccess.invitedBy, users.id))
        .where(and(eq(projectAccess.invitationToken, token), isNull(projectAccess.deletedAt)))
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation link.",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        })
      }

      // Check if expired
      if (invitation[0].expiresAt && new Date() > invitation[0].expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired.",
        })
      }

      // Check if user with this email already exists
      let existingUser = null
      if (invitation[0].invitedEmail) {
        const userResult = await ctx.db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.email, invitation[0].invitedEmail))
          .limit(1)

        existingUser = userResult[0] || null
      }

      return {
        email: invitation[0].invitedEmail || "",
        projectId: invitation[0].projectId,
        projectName: invitation[0].project?.name || "Unknown Project",
        inviterName: invitation[0].inviter
          ? `${invitation[0].inviter.firstName} ${invitation[0].inviter.lastName}`
          : "Someone",
        permission: invitation[0].permission as "read" | "write",
        expiresAt: invitation[0].expiresAt,
        userExists: !!existingUser,
        existingUserId: existingUser?.id || null,
      }
    }),

  /**
   * Auto-accept invitation for logged-in user
   *
   * Automatically links existing user account to invitation if their
   * email matches the invited email. Used when a logged-in user
   * visits an invitation link.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not logged in
   * @throws {TRPCError} NOT_FOUND - Invalid invitation token
   * @throws {TRPCError} BAD_REQUEST - Email mismatch or invitation expired
   */
  autoAcceptInvitation: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { token } = input
      const userId = ctx.user!.id

      // Find invitation by token
      const invitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(and(eq(projectAccess.invitationToken, token), isNull(projectAccess.deletedAt)))
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation link.",
        })
      }

      // Check if expired
      if (invitation[0].expiresAt && new Date() > invitation[0].expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired. Please request a new one.",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        })
      }

      // Verify that logged-in user's email matches the invited email
      const user = await ctx.db.select().from(users).where(eq(users.id, userId)).limit(1)

      if (!user[0] || user[0].email !== invitation[0].invitedEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This invitation was sent to a different email address. Please log out and use the correct account.",
        })
      }

      const now = new Date()

      // Update invitation with userId and acceptedAt
      await ctx.db
        .update(projectAccess)
        .set({
          userId,
          acceptedAt: now,
          invitationToken: null, // Clear token after use
          updatedAt: now,
        })
        .where(eq(projectAccess.id, invitation[0].id))

      // Mark user's email as verified
      await ctx.db
        .update(users)
        .set({
          emailVerified: true,
        })
        .where(eq(users.id, userId))

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        projectId: invitation[0].projectId,
        entityType: "project_access",
        entityId: invitation[0].id,
        action: "update",
        userId,
        metadata: JSON.stringify({
          accepted: true,
          autoAccepted: true,
        }),
        timestamp: now,
        createdAt: now,
      })

      return {
        success: true,
        message: "Invitation accepted successfully.",
        projectId: invitation[0].projectId,
      }
    }),

  /**
   * Accept a project invitation
   *
   * Links the user account to the project access record and marks
   * email as verified.
   *
   * @throws {TRPCError} NOT_FOUND - Invalid invitation token
   * @throws {TRPCError} BAD_REQUEST - Invitation expired
   */
  acceptInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { token, userId } = input

      // Find invitation by token
      const invitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(and(eq(projectAccess.invitationToken, token), isNull(projectAccess.deletedAt)))
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation link.",
        })
      }

      // Check if expired
      if (invitation[0].expiresAt && new Date() > invitation[0].expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired. Please request a new one.",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        })
      }

      const now = new Date()

      // Update invitation with userId and acceptedAt
      await ctx.db
        .update(projectAccess)
        .set({
          userId,
          acceptedAt: now,
          invitationToken: null, // Clear token after use
          updatedAt: now,
        })
        .where(eq(projectAccess.id, invitation[0].id))

      // Mark user's email as verified
      await ctx.db
        .update(users)
        .set({
          emailVerified: true,
        })
        .where(eq(users.id, userId))

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        entityType: "project_access",
        entityId: invitation[0].id,
        action: "update",
        userId,
        metadata: JSON.stringify({
          accepted: true,
        }),
        timestamp: now,
      })

      return {
        success: true,
        message: "Invitation accepted successfully.",
        projectId: invitation[0].projectId,
      }
    }),

  /**
   * List all invitations for a project
   *
   * Returns pending and accepted invitations with user details
   * and expiration information.
   *
   * @throws {TRPCError} FORBIDDEN - User is not project owner
   */
  listInvitations: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input: projectId, ctx }) => {
      const userId = ctx.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        })
      }

      // Verify user owns the project
      const project = await ctx.db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1)

      if (!project[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      if (project[0].ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can view invitations",
        })
      }

      // Get all invitations (pending and accepted, not deleted)
      const invitations = await ctx.db
        .select({
          id: projectAccess.id,
          permission: projectAccess.permission,
          invitedAt: projectAccess.invitedAt,
          acceptedAt: projectAccess.acceptedAt,
          expiresAt: projectAccess.expiresAt,
          invitationToken: projectAccess.invitationToken,
          userId: projectAccess.userId,
          invitedEmail: projectAccess.invitedEmail, // Email for pending invitations
          user: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(projectAccess)
        .leftJoin(users, eq(projectAccess.userId, users.id))
        .where(and(eq(projectAccess.projectId, projectId), isNull(projectAccess.deletedAt)))
        .orderBy(projectAccess.invitedAt)

      // Calculate status and days remaining
      const now = new Date()
      const enrichedInvitations = invitations.map((inv: any) => {
        let status: "pending" | "accepted" | "expired"
        let daysRemaining: number | null = null

        if (inv.acceptedAt) {
          status = "accepted"
        } else if (inv.expiresAt && now > inv.expiresAt) {
          status = "expired"
        } else {
          status = "pending"
          if (inv.expiresAt) {
            daysRemaining = Math.ceil(
              (inv.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        }

        return {
          id: inv.id,
          email: inv.invitedEmail || inv.user?.email || "", // Use invitedEmail for pending, user.email for accepted
          status,
          permission: inv.permission as "read" | "write",
          invitedAt: inv.invitedAt,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
          daysRemaining,
          user: inv.userId
            ? {
                firstName: inv.user?.firstName || "",
                lastName: inv.user?.lastName || "",
              }
            : undefined,
        }
      })

      return enrichedInvitations
    }),

  /**
   * Revoke partner access to a project
   *
   * Soft deletes the project access record.
   *
   * @throws {TRPCError} FORBIDDEN - User is not project owner
   */
  revokeAccess: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        accessId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { projectId, accessId } = input
      const userId = ctx.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        })
      }

      // Verify user owns the project
      const project = await ctx.db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1)

      if (!project[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      if (project[0].ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can revoke access",
        })
      }

      const now = new Date()

      // Soft delete the access record
      await ctx.db
        .update(projectAccess)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(projectAccess.id, accessId))

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        entityType: "project_access",
        entityId: accessId,
        action: "delete",
        userId,
        metadata: JSON.stringify({
          revoked: true,
        }),
        timestamp: now,
      })

      return {
        success: true,
        message: "Access revoked successfully.",
      }
    }),

  /**
   * Resend invitation email with new token
   *
   * Generates new token, resets expiration, and resends email.
   *
   * @throws {TRPCError} NOT_FOUND - Invitation not found
   * @throws {TRPCError} BAD_REQUEST - Invitation already accepted
   */
  resendInvitation: protectedProcedure
    .input(z.object({ accessId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { accessId } = input
      const userId = ctx.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        })
      }

      // Get invitation
      const invitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(and(eq(projectAccess.id, accessId), isNull(projectAccess.deletedAt)))
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        })
      }

      // Verify user owns the project
      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, invitation[0].projectId))
        .limit(1)

      if (!project[0] || project[0].ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can resend invitations",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot resend invitation that has already been accepted",
        })
      }

      // Generate new token and reset expiration
      const newToken = randomUUID()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      await ctx.db
        .update(projectAccess)
        .set({
          invitationToken: newToken,
          expiresAt,
          updatedAt: now,
        })
        .where(eq(projectAccess.id, accessId))

      // Get inviter details for email
      const inviter = await ctx.db.select().from(users).where(eq(users.id, userId)).limit(1)

      // Get email from invitedEmail field (for pending) or userId lookup (for accepted)
      let email = invitation[0].invitedEmail || ""
      if (!email && invitation[0].userId) {
        const invitedUser = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, invitation[0].userId))
          .limit(1)
        email = invitedUser[0]?.email || ""
      }

      // Resend invitation email
      await emailService.sendInvitationEmail({
        email,
        projectName: project[0].name,
        inviterName: `${inviter[0]?.firstName} ${inviter[0]?.lastName}`,
        inviterEmail: inviter[0]?.email || "",
        permission: invitation[0].permission as "read" | "write",
        invitationToken: newToken,
        expiresAt,
      })

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        entityType: "project_access",
        entityId: accessId,
        action: "update",
        userId,
        metadata: JSON.stringify({
          resent: true,
        }),
        timestamp: now,
      })

      return {
        success: true,
        message: "Invitation resent successfully.",
      }
    }),

  /**
   * Cancel a pending invitation
   *
   * Soft deletes a pending invitation that hasn't been accepted yet.
   *
   * @throws {TRPCError} FORBIDDEN - User is not project owner
   * @throws {TRPCError} BAD_REQUEST - Invitation already accepted
   */
  cancelInvitation: protectedProcedure
    .input(z.object({ accessId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { accessId } = input
      const userId = ctx.user?.id

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        })
      }

      // Get invitation
      const invitation = await ctx.db
        .select()
        .from(projectAccess)
        .where(and(eq(projectAccess.id, accessId), isNull(projectAccess.deletedAt)))
        .limit(1)

      if (!invitation[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        })
      }

      // Verify user owns the project
      const project = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, invitation[0].projectId))
        .limit(1)

      if (!project[0] || project[0].ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can cancel invitations",
        })
      }

      // Check if already accepted
      if (invitation[0].acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel invitation that has already been accepted. Use revoke instead.",
        })
      }

      const now = new Date()

      // Soft delete the invitation
      await ctx.db
        .update(projectAccess)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(projectAccess.id, accessId))

      // Create audit log
      await ctx.db.insert(auditLog).values({
        id: randomUUID(),
        entityType: "project_access",
        entityId: accessId,
        action: "delete",
        userId,
        metadata: JSON.stringify({
          cancelled: true,
        }),
        timestamp: now,
      })

      return {
        success: true,
        message: "Invitation cancelled successfully.",
      }
    }),
})
