import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull, or, isNotNull } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { projects } from "@/server/db/schema/projects"
import { addresses } from "@/server/db/schema/addresses"
import { projectAccess } from "@/server/db/schema/projectAccess"

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
   * Lists all projects owned by the authenticated user
   *
   * Returns projects with associated address data, excluding soft-deleted
   * projects. Results are ordered by creation date (oldest first).
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @returns {Array<Project & { address: Address | null }>} User's projects with addresses
   *
   * @example
   * const projects = await trpc.project.list.useQuery();
   * // Returns: [{ id, name, address, ... }, ...]
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const userProjects = await ctx.db
      .select({
        project: projects,
        address: addresses,
      })
      .from(projects)
      .leftJoin(addresses, eq(projects.addressId, addresses.id))
      .leftJoin(
        projectAccess,
        and(
          eq(projectAccess.projectId, projects.id),
          eq(projectAccess.userId, userId),
          isNotNull(projectAccess.acceptedAt),
          isNull(projectAccess.deletedAt)
        )
      )
      .where(
        and(
          or(
            eq(projects.ownerId, userId), // User owns the project
            isNotNull(projectAccess.id) // OR user has accepted partner access
          ),
          isNull(projects.deletedAt)
        )
      )
      .orderBy(projects.createdAt)

    return userProjects.map(({ project, address }) => ({
      ...project,
      address: address ?? null,
    }))
  }),

  /**
   * Retrieves a single project by ID with access verification
   *
   * Returns project with associated address. Enforces access control by
   * verifying the authenticated user owns the project OR has accepted partner access.
   * Excludes soft-deleted projects.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to this project
   * @returns {Project & { address: Address | null }} Project with address data
   *
   * @example
   * const project = await trpc.project.getById.useQuery({ id: "uuid-here" });
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const result = await ctx.db
        .select({
          project: projects,
          address: addresses,
        })
        .from(projects)
        .leftJoin(addresses, eq(projects.addressId, addresses.id))
        .leftJoin(
          projectAccess,
          and(
            eq(projectAccess.projectId, projects.id),
            eq(projectAccess.userId, userId),
            isNotNull(projectAccess.acceptedAt),
            isNull(projectAccess.deletedAt)
          )
        )
        .where(
          and(
            eq(projects.id, input.id),
            or(
              eq(projects.ownerId, userId), // User owns the project
              isNotNull(projectAccess.id) // OR user has accepted partner access
            ),
            isNull(projects.deletedAt)
          )
        )
        .limit(1)

      const projectData = result[0]

      if (!projectData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or you do not have permission to access it",
        })
      }

      return {
        ...projectData.project,
        address: projectData.address ?? null,
      }
    }),

  /**
   * Updates an existing project with ownership verification
   *
   * Allows updating project fields including name, description, address,
   * type, status, dates, and budget. Verifies user owns the project before
   * allowing updates. Address updates modify the associated address record.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project
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
    const userId = ctx.session.user.id

    // Verify ownership
    const existingProject = await ctx.db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, input.id), eq(projects.ownerId, userId), isNull(projects.deletedAt))
      )
      .limit(1)

    if (!existingProject[0]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project not found or you do not have permission to update it",
      })
    }

    // Update address if provided
    let addressId = existingProject[0].addressId
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
   * Verifies user owns the project before deletion.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own this project
   * @returns {Project} The soft-deleted project with deletedAt timestamp
   *
   * @example
   * await trpc.project.softDelete.mutate({ id: "uuid-here" });
   */
  softDelete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify ownership
      const existingProject = await ctx.db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, input.id), eq(projects.ownerId, userId), isNull(projects.deletedAt))
        )
        .limit(1)

      if (!existingProject[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or you do not have permission to delete it",
        })
      }

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
