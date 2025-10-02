import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { projects } from "@/server/db/schema/projects"
import { addresses } from "@/server/db/schema/addresses"

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
 * Project router with CRUD operations
 */
export const projectRouter = createTRPCRouter({
  /**
   * Create a new project
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
   * List all projects for the authenticated user
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
      .where(and(eq(projects.ownerId, userId), isNull(projects.deletedAt)))
      .orderBy(projects.createdAt)

    return userProjects.map(({ project, address }: { project: any; address: any }) => ({
      ...project,
      address: address ?? null,
    }))
  }),

  /**
   * Get a project by ID with access control
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
        .where(
          and(eq(projects.id, input.id), eq(projects.ownerId, userId), isNull(projects.deletedAt))
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
   * Update a project
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
   * Soft delete a project
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
