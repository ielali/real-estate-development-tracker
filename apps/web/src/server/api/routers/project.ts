import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { projects } from "@/server/db/schema/projects"
import { addresses } from "@/server/db/schema/addresses"
import {
  getAccessibleProjects,
  verifyProjectAccess,
  assertProjectOwner,
} from "../helpers/authorization"
import { backupService } from "@/server/services/backup.service"
import { backupRateLimiter, RATE_LIMITS } from "@/lib/rate-limiter"
import { securityEventLogger, getRequestMetadata } from "@/server/services/security-event-logger"
import { emailService } from "@/lib/email"

/**
 * Zod schema for Australian states
 */
const australianStateSchema = z.enum(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"])

/**
 * Zod schema for address validation
 */
const addressSchema = z.object({
  streetNumber: z.string().min(1, "Street number is required"),
  streetName: z.string().min(1, "Street name is required"),
  streetType: z.string().nullable().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  state: australianStateSchema,
  postcode: z.string().regex(/^\d{4}$/, "Postcode must be 4 digits"),
  country: z.string().default("Australia"),
  formatted: z.string().optional(),
})

/**
 * Zod schema for project type
 */
const projectTypeSchema = z.enum(["renovation", "new_build", "development", "maintenance"])

/**
 * Zod schema for project status
 */
const projectStatusSchema = z.enum(["planning", "active", "on_hold", "completed", "archived"])

/**
 * Zod schema for creating a project
 */
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().nullable().optional(),
  address: addressSchema,
  projectType: projectTypeSchema,
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  totalBudget: z.number().positive().nullable().optional(),
})

/**
 * Zod schema for updating a project
 */
const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().nullable().optional(),
  address: addressSchema.optional(),
  projectType: projectTypeSchema.optional(),
  status: projectStatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().nullable().optional(),
  totalBudget: z.number().positive().nullable().optional(),
})

/**
 * Project router with CRUD operations for real estate development projects
 *
 * Provides type-safe API endpoints for creating, reading, updating, and
 * deleting projects. All operations require authentication and enforce
 * ownership-based access control.
 */
export const projectRouter = createTRPCRouter({
  /**
   * Creates a new real estate development project
   *
   * Validates project data, creates database record with associated address,
   * and returns the new project with proper access control for the
   * authenticated user.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} BAD_REQUEST - Invalid project data
   * @returns {Project} The newly created project with address
   *
   * @example
   * const project = await trpc.project.create.mutate({
   *   name: "Sunset Boulevard Renovation",
   *   address: {
   *     streetNumber: "123",
   *     streetName: "Sunset Blvd",
   *     suburb: "Hollywood",
   *     state: "NSW",
   *     postcode: "2000"
   *   },
   *   startDate: new Date("2025-01-01"),
   *   projectType: "renovation"
   * });
   */
  create: protectedProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Format address string for display
    const formattedAddress =
      input.address.formatted ??
      `${input.address.streetNumber} ${input.address.streetName}${input.address.streetType ? " " + input.address.streetType : ""}, ${input.address.suburb}, ${input.address.state} ${input.address.postcode}`

    // Create address first
    const [address] = await ctx.db
      .insert(addresses)
      .values({
        streetNumber: input.address.streetNumber,
        streetName: input.address.streetName,
        streetType: input.address.streetType ?? null,
        suburb: input.address.suburb,
        state: input.address.state,
        postcode: input.address.postcode,
        country: input.address.country,
        formattedAddress,
      })
      .returning()

    if (!address) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create address",
      })
    }

    // Create project
    const [project] = await ctx.db
      .insert(projects)
      .values({
        name: input.name,
        description: input.description ?? null,
        addressId: address.id,
        projectType: input.projectType,
        status: "planning",
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        ownerId: userId,
        totalBudget: input.totalBudget ?? null,
      })
      .returning()

    if (!project) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create project",
      })
    }

    return project
  }),

  /**
   * Lists all projects accessible by the authenticated user
   *
   * Returns projects with associated address data and permission metadata.
   * Includes:
   * - Projects owned by the user (access: "owner", permission: "write")
   * - Projects shared via accepted partner invitations (access: "partner", permission: "read" | "write")
   *
   * Excludes soft-deleted projects. Results are ordered by creation date (oldest first).
   *
   * Story 4.2: Uses getAccessibleProjects() helper for consistent RBAC.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @returns {Array<Project & { address: Address | null, userPermission: string, access: string }>}
   *
   * @example
   * const projects = await trpc.project.list.useQuery();
   * // Returns: [
   * //   { id, name, address, userPermission: "write", access: "owner", ... },
   * //   { id, name, address, userPermission: "read", access: "partner", ... }
   * // ]
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    // Use centralized helper to get all accessible projects with permission metadata
    const accessibleProjects = await getAccessibleProjects(ctx)

    // Fetch addresses for all accessible projects
    const projectIds = accessibleProjects.map((item) => item.project.id)

    if (projectIds.length === 0) {
      return []
    }

    // Get addresses in a single query
    const addressResults = await ctx.db.query.addresses.findMany({
      where: (
        addresses: any,
        { inArray }: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) =>
        inArray(
          addresses.id,
          accessibleProjects
            .map((item) => item.project.addressId)
            .filter((id): id is string => id !== null)
        ),
    })

    // Create address lookup map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addressMap = new Map(addressResults.map((addr: any) => [addr.id, addr]))

    // Combine project data with addresses and permission metadata
    return accessibleProjects.map((item) => ({
      ...item.project,
      address: item.project.addressId ? (addressMap.get(item.project.addressId) ?? null) : null,
      userPermission: item.permission, // "read" | "write"
      access: item.access, // "owner" | "partner"
    }))
  }),

  /**
   * Retrieves a single project by ID with access verification
   *
   * Returns project with associated address and permission metadata.
   * Enforces access control using centralized authorization helper.
   *
   * Story 4.2: Uses verifyProjectAccess() for consistent RBAC and audit logging.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to this project
   * @returns {Project & { address: Address | null, userPermission: string, access: string }}
   *
   * @example
   * const project = await trpc.project.getById.useQuery({ id: "uuid-here" });
   * // Returns: { id, name, address, userPermission: "write", access: "owner", ... }
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify access and get permission metadata (also logs access attempt)
      const { project, access, permission } = await verifyProjectAccess(ctx, input.id, "read")

      // Fetch address if project has one
      let address = null
      if (project.addressId) {
        address = await ctx.db.query.addresses.findFirst({
          where: eq(addresses.id, project.addressId),
        })
      }

      return {
        ...project,
        address: address ?? null,
        userPermission: permission, // "read" | "write"
        access, // "owner" | "partner"
      }
    }),

  /**
   * Updates an existing project with ownership verification
   *
   * Allows updating project fields including name, description, address,
   * type, status, dates, and budget.
   *
   * Story 4.2: Only project owners can update projects. Partners cannot modify projects,
   * even with write permission. Uses authorization helpers for consistent RBAC.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project (partners cannot update)
   * @returns {Project} The updated project
   *
   * @example
   * const updated = await trpc.project.update.mutate({
   *   id: "uuid-here",
   *   name: "Updated Project Name",
   *   status: "active"
   * });
   */
  update: protectedProcedure.input(updateProjectSchema).mutation(async ({ ctx, input }) => {
    // Verify access and ensure user is owner (not just a partner)
    const accessInfo = await verifyProjectAccess(ctx, input.id, "read")
    assertProjectOwner(accessInfo, "update project")

    const existingProject = accessInfo.project

    // Update address if provided
    let addressId = existingProject.addressId
    if (input.address && addressId) {
      const formattedAddress =
        input.address.formatted ??
        `${input.address.streetNumber} ${input.address.streetName}${input.address.streetType ? " " + input.address.streetType : ""}, ${input.address.suburb}, ${input.address.state} ${input.address.postcode}`

      await ctx.db
        .update(addresses)
        .set({
          streetNumber: input.address.streetNumber,
          streetName: input.address.streetName,
          streetType: input.address.streetType ?? null,
          suburb: input.address.suburb,
          state: input.address.state,
          postcode: input.address.postcode,
          country: input.address.country,
          formattedAddress,
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId))
    } else if (input.address && !addressId) {
      // Create new address if one doesn't exist
      const formattedAddress =
        input.address.formatted ??
        `${input.address.streetNumber} ${input.address.streetName}${input.address.streetType ? " " + input.address.streetType : ""}, ${input.address.suburb}, ${input.address.state} ${input.address.postcode}`

      const [newAddress] = await ctx.db
        .insert(addresses)
        .values({
          streetNumber: input.address.streetNumber,
          streetName: input.address.streetName,
          streetType: input.address.streetType ?? null,
          suburb: input.address.suburb,
          state: input.address.state,
          postcode: input.address.postcode,
          country: input.address.country,
          formattedAddress,
        })
        .returning()

      addressId = newAddress?.id ?? null
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.projectType !== undefined) updateData.projectType = input.projectType
    if (input.status !== undefined) updateData.status = input.status
    if (input.startDate !== undefined) updateData.startDate = input.startDate
    if (input.endDate !== undefined) updateData.endDate = input.endDate
    if (input.totalBudget !== undefined) updateData.totalBudget = input.totalBudget
    if (addressId !== undefined) updateData.addressId = addressId

    // Update project
    const [updatedProject] = await ctx.db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, input.id))
      .returning()

    if (!updatedProject) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update project",
      })
    }

    return updatedProject
  }),

  /**
   * Soft deletes a project (sets deletedAt timestamp)
   *
   * Marks the project as deleted without removing data from database.
   * Allows for data recovery and maintains referential integrity.
   *
   * Story 4.2: Only project owners can delete projects. Partners cannot delete projects,
   * even with write permission. Uses authorization helpers for consistent RBAC.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project (partners cannot delete)
   * @returns {void}
   *
   * @example
   * await trpc.project.softDelete.mutate({ id: "uuid-here" });
   */
  softDelete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify access and ensure user is owner (not just a partner)
      const accessInfo = await verifyProjectAccess(ctx, input.id, "read")
      assertProjectOwner(accessInfo, "delete project")

      // Soft delete
      await ctx.db
        .update(projects)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, input.id))
    }),

  /**
   * Generate project backup (JSON or ZIP)
   *
   * Story 6.2: Generates complete backup of project data.
   * - JSON: Metadata only (~50KB)
   * - ZIP: Metadata + all document files
   *
   * Rate limits:
   * - JSON: 5 per hour
   * - ZIP: 2 per hour (more resource intensive)
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project
   * @throws {TRPCError} TOO_MANY_REQUESTS - Rate limit exceeded
   * @returns Backup data with metadata
   */
  generateBackup: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        backupType: z.enum(["json", "zip"]).default("json"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify user owns the project
      const accessInfo = await verifyProjectAccess(ctx, input.projectId, "read")
      assertProjectOwner(accessInfo, "generate backup")

      // Check rate limit based on backup type
      const limits = input.backupType === "json" ? RATE_LIMITS.JSON : RATE_LIMITS.ZIP
      const canProceed = backupRateLimiter.check(
        userId,
        input.backupType,
        limits.MAX_REQUESTS,
        limits.WINDOW_MS
      )

      if (!canProceed) {
        const resetIn = backupRateLimiter.getTimeUntilReset(userId, input.backupType)
        const minutesRemaining = Math.ceil(resetIn / 1000 / 60)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `${input.backupType.toUpperCase()} backup limit exceeded. You can download ${limits.MAX_REQUESTS} ${input.backupType} backups per hour. Try again in ${minutesRemaining} minutes.`,
        })
      }

      // Generate backup based on type
      if (input.backupType === "json") {
        const backupData = await backupService.generateProjectBackup(input.projectId, userId)
        const jsonString = JSON.stringify(backupData, null, 2)
        const fileSize = Buffer.byteLength(jsonString, "utf8")

        // Record backup in database
        await backupService.recordBackup(
          input.projectId,
          userId,
          "json",
          fileSize,
          0 // No documents in JSON backup
        )

        // Return backup data
        const project = accessInfo.project
        const sanitizedName = project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "")
          .replace(/\..+/, "")
          .replace("T", "-")
        const filename = `${sanitizedName}-backup-${timestamp}.json`

        // Story 6.3: Log security event and send email notification
        const { ipAddress, userAgent } = getRequestMetadata(ctx.headers)
        const user = ctx.session.user

        // Log security event (async, don't block response)
        securityEventLogger
          .logBackupDownloaded(userId, input.projectId, project.name, ipAddress, userAgent)
          .catch((err) => console.error("Failed to log backup download event:", err))

        // Send email notification (async, don't block response)
        emailService
          .sendBackupDownloadedEmail(
            { email: user.email, name: user.name },
            project.name,
            new Date(),
            userAgent,
            ipAddress
          )
          .catch((err) => console.error("Failed to send backup download email:", err))

        return {
          backupData,
          filename,
          fileSize,
        }
      } else {
        // ZIP backup
        const zipBlob = await backupService.generateZipArchive(input.projectId, userId)
        const fileSize = zipBlob.size

        // Get document count
        const backupData = await backupService.generateProjectBackup(input.projectId, userId)
        const documentCount = backupData.documents.length

        // Record backup in database
        await backupService.recordBackup(input.projectId, userId, "zip", fileSize, documentCount)

        // Convert blob to base64 for transfer
        const arrayBuffer = await zipBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const zipData = buffer.toString("base64")

        const project = accessInfo.project
        const sanitizedName = project.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "")
          .replace(/\..+/, "")
          .replace("T", "-")
        const filename = `${sanitizedName}-archive-${timestamp}.zip`

        // Story 6.3: Log security event and send email notification
        const { ipAddress, userAgent } = getRequestMetadata(ctx.headers)
        const user = ctx.session.user

        // Log security event (async, don't block response)
        securityEventLogger
          .logBackupDownloaded(userId, input.projectId, project.name, ipAddress, userAgent)
          .catch((err) => console.error("Failed to log backup download event:", err))

        // Send email notification (async, don't block response)
        emailService
          .sendBackupDownloadedEmail(
            { email: user.email, name: user.name },
            project.name,
            new Date(),
            userAgent,
            ipAddress
          )
          .catch((err) => console.error("Failed to send backup download email:", err))

        return {
          zipData,
          filename,
          fileSize,
        }
      }
    }),

  /**
   * Get backup history for a project
   *
   * Story 6.2: Returns last 10 backups with metadata.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project
   * @returns Array of recent backups
   */
  getBackupHistory: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the project
      const accessInfo = await verifyProjectAccess(ctx, input.projectId, "read")
      assertProjectOwner(accessInfo, "view backup history")

      // Get backup history
      const backups = await backupService.getBackupHistory(input.projectId, 10)

      return backups
    }),

  /**
   * Estimate ZIP archive size before generation
   *
   * Story 6.2: Provides size estimate to inform user before initiating download.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project
   * @returns Size estimate with warning if large
   */
  estimateZipSize: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the project
      const accessInfo = await verifyProjectAccess(ctx, input.projectId, "read")
      assertProjectOwner(accessInfo, "estimate backup size")

      // Get size estimate
      const estimate = await backupService.estimateZipSize(input.projectId)

      return estimate
    }),

  /**
   * Get all members of a project for @mention autocomplete
   *
   * Story 8.3: Returns project owner and all accepted partners with user info.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to this project
   * @returns Array of project members with id, name, and email
   */
  getMembers: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to the project
      await verifyProjectAccess(ctx, input.projectId, "read")

      // Import necessary schemas
      const { projectAccess } = await import("@/server/db/schema/projectAccess")
      const { users } = await import("@/server/db/schema/users")
      const { isNull, isNotNull } = await import("drizzle-orm")

      // Get project owner
      const [project] = await ctx.db
        .select({
          ownerId: projects.ownerId,
        })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1)

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      // Get owner user info
      const [owner] = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, project.ownerId))
        .limit(1)

      // Get all accepted partners
      const partners = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(projectAccess)
        .innerJoin(users, eq(projectAccess.userId, users.id))
        .where(
          eq(projectAccess.projectId, input.projectId),
          isNotNull(projectAccess.acceptedAt),
          isNull(projectAccess.deletedAt)
        )

      // Combine and deduplicate (in case owner is also in partners list)
      const membersMap = new Map()
      if (owner) {
        membersMap.set(owner.id, owner)
      }
      partners.forEach((partner: { id: string; name: string; email: string }) => {
        membersMap.set(partner.id, partner)
      })

      return Array.from(membersMap.values())
    }),
})
