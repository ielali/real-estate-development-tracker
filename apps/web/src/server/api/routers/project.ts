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
      where: (addresses: any, { inArray }: any) =>
        inArray(
          addresses.id,
          accessibleProjects
            .map((item) => item.project.addressId)
            .filter((id): id is string => id !== null)
        ),
    })

    // Create address lookup map
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
})
