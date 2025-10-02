import { TRPCError } from "@trpc/server"
import { eq, and, isNull, gte, lte } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { costs } from "@/server/db/schema/costs"
import { projects } from "@/server/db/schema/projects"
import { categories } from "@/server/db/schema/categories"
import {
  createCostSchema,
  updateCostSchema,
  listCostsSchema,
  getCostByIdSchema,
  deleteCostSchema,
} from "@/lib/validations/cost"
import type { Database } from "@/server/db"

/**
 * Helper function to verify project ownership
 * Throws FORBIDDEN error if user doesn't own the project
 */
async function verifyProjectOwnership(
  db: Database,
  projectId: string,
  userId: string
): Promise<void> {
  const project = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.ownerId, userId), isNull(projects.deletedAt))
    )
    .limit(1)

  if (!project[0]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Project not found or you do not have permission to access it",
    })
  }
}

/**
 * Helper function to verify cost ownership through project
 * Throws FORBIDDEN error if user doesn't own the project containing this cost
 */
async function verifyCostOwnership(db: Database, costId: string, userId: string): Promise<void> {
  const result = await db
    .select({
      cost: costs,
      project: projects,
    })
    .from(costs)
    .innerJoin(projects, eq(costs.projectId, projects.id))
    .where(and(eq(costs.id, costId), isNull(costs.deletedAt), isNull(projects.deletedAt)))
    .limit(1)

  const costData = result[0]

  if (!costData || costData.project.ownerId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cost not found or you do not have permission to access it",
    })
  }
}

/**
 * Cost router with CRUD operations for cost tracking
 *
 * All operations require authentication and verify project ownership
 * before allowing access to cost data.
 */
export const costRouter = createTRPCRouter({
  /**
   * Create a new cost entry
   *
   * Validates that:
   * - User owns the project
   * - Category exists and is a cost category
   * - Amount is stored as integer (cents)
   * - Date is not in the future
   */
  create: protectedProcedure.input(createCostSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project ownership
    await verifyProjectOwnership(ctx.db, input.projectId, userId)

    // Verify category exists and is a cost category
    const category = await ctx.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), eq(categories.type, "cost")))
      .limit(1)

    if (!category[0]) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid cost category",
      })
    }

    // Create cost entry
    const [cost] = await ctx.db
      .insert(costs)
      .values({
        projectId: input.projectId,
        amount: input.amount,
        description: input.description,
        categoryId: input.categoryId,
        date: input.date,
        contactId: input.contactId ?? null,
        documentIds: null,
        createdById: userId,
      })
      .returning()

    if (!cost) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create cost entry",
      })
    }

    return cost
  }),

  /**
   * List all costs for a project with optional filters
   *
   * Returns costs ordered by date (newest first) with category information
   * Supports filtering by:
   * - Category
   * - Date range (startDate to endDate)
   */
  list: protectedProcedure.input(listCostsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project ownership
    await verifyProjectOwnership(ctx.db, input.projectId, userId)

    // Build where conditions
    const conditions = [eq(costs.projectId, input.projectId), isNull(costs.deletedAt)]

    if (input.categoryId) {
      conditions.push(eq(costs.categoryId, input.categoryId))
    }

    if (input.startDate) {
      conditions.push(gte(costs.date, input.startDate))
    }

    if (input.endDate) {
      conditions.push(lte(costs.date, input.endDate))
    }

    // Fetch costs with category information
    const projectCosts = await ctx.db
      .select({
        cost: costs,
        category: categories,
      })
      .from(costs)
      .leftJoin(categories, eq(costs.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(costs.date)

    return projectCosts.map(({ cost, category }: { cost: any; category: any }) => ({
      ...cost,
      category: category ?? null,
    }))
  }),

  /**
   * Get a single cost by ID with access control
   *
   * Verifies user owns the project before returning cost details
   */
  getById: protectedProcedure.input(getCostByIdSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify cost ownership through project
    await verifyCostOwnership(ctx.db, input.id, userId)

    // Fetch cost with category information
    const result = await ctx.db
      .select({
        cost: costs,
        category: categories,
      })
      .from(costs)
      .leftJoin(categories, eq(costs.categoryId, categories.id))
      .where(and(eq(costs.id, input.id), isNull(costs.deletedAt)))
      .limit(1)

    const costData = result[0]

    if (!costData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cost not found",
      })
    }

    return {
      ...costData.cost,
      category: costData.category ?? null,
    }
  }),

  /**
   * Update an existing cost entry
   *
   * Validates ownership and category before updating
   * Only updates fields that are provided in input
   */
  update: protectedProcedure.input(updateCostSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify cost ownership
    await verifyCostOwnership(ctx.db, input.id, userId)

    // Verify category if being updated
    if (input.categoryId) {
      const category = await ctx.db
        .select()
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.type, "cost")))
        .limit(1)

      if (!category[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid cost category",
        })
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (input.amount !== undefined) updateData.amount = input.amount
    if (input.description !== undefined) updateData.description = input.description
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId
    if (input.date !== undefined) updateData.date = input.date
    if (input.contactId !== undefined) updateData.contactId = input.contactId

    // Update cost
    const [updatedCost] = await ctx.db
      .update(costs)
      .set(updateData)
      .where(eq(costs.id, input.id))
      .returning()

    if (!updatedCost) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update cost entry",
      })
    }

    return updatedCost
  }),

  /**
   * Soft delete a cost entry
   *
   * Sets deletedAt timestamp instead of removing from database
   * Maintains data integrity and audit trail
   */
  softDelete: protectedProcedure.input(deleteCostSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify cost ownership
    await verifyCostOwnership(ctx.db, input.id, userId)

    // Soft delete
    await ctx.db
      .update(costs)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(costs.id, input.id))

    return { success: true }
  }),

  /**
   * Get total cost for a project
   *
   * Calculates running total of all non-deleted costs
   * Returns amount in cents
   */
  getTotal: protectedProcedure.input(listCostsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project ownership
    await verifyProjectOwnership(ctx.db, input.projectId, userId)

    // Build where conditions
    const conditions = [eq(costs.projectId, input.projectId), isNull(costs.deletedAt)]

    if (input.categoryId) {
      conditions.push(eq(costs.categoryId, input.categoryId))
    }

    if (input.startDate) {
      conditions.push(gte(costs.date, input.startDate))
    }

    if (input.endDate) {
      conditions.push(lte(costs.date, input.endDate))
    }

    // Fetch all costs matching criteria
    const projectCosts = await ctx.db
      .select({
        amount: costs.amount,
      })
      .from(costs)
      .where(and(...conditions))

    // Calculate total
    const total = projectCosts.reduce((sum: number, cost: any) => sum + cost.amount, 0)

    return { total }
  }),
})
