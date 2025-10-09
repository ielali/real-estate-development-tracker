import { TRPCError } from "@trpc/server"
import { eq, and, isNull, gte, lte, inArray, ilike, or, desc, asc } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { costs } from "@/server/db/schema/costs"
import { projects } from "@/server/db/schema/projects"
import { categories } from "@/server/db/schema/categories"
import { contacts } from "@/server/db/schema/contacts"
import {
  createCostSchema,
  updateCostSchema,
  listCostsSchema,
  getCostByIdSchema,
  deleteCostSchema,
} from "@/lib/validations/cost"
import type { Database } from "@/server/db"
import { z } from "zod"

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
   * Returns costs ordered by date (newest first) with category and contact information
   * Supports filtering by:
   * - Category
   * - Date range (startDate to endDate)
   * - Text search on description (Story 2.4)
   * - Amount range (min/max) (Story 2.4)
   * - Contact ID or contact name search (Story 2.4)
   * - Sorting by date, amount, contact, or category (Story 2.4)
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

    // Story 2.4: Text search on description
    if (input.searchText) {
      conditions.push(ilike(costs.description, `%${input.searchText}%`))
    }

    // Story 2.4: Amount range filtering
    if (input.minAmount !== undefined) {
      conditions.push(gte(costs.amount, input.minAmount))
    }
    if (input.maxAmount !== undefined) {
      conditions.push(lte(costs.amount, input.maxAmount))
    }

    // Story 2.4: Contact filter by ID
    if (input.contactId) {
      conditions.push(eq(costs.contactId, input.contactId))
    }

    // Story 2.4: Contact name search (requires join with contacts table)
    // Note: This filter will only match costs that have a contact assigned
    // It will not return costs with NULL contactId
    if (input.contactNameSearch) {
      const nameSearch = `%${input.contactNameSearch}%`
      // Filter only applies to costs with contacts (not NULL)
      const contactSearchCondition = and(
        isNull(contacts.deletedAt), // Ensure contact is not deleted
        or(
          ilike(contacts.firstName, nameSearch),
          ilike(contacts.lastName, nameSearch),
          ilike(contacts.company, nameSearch)
        )
      )
      if (contactSearchCondition) {
        conditions.push(contactSearchCondition)
      }
    }

    // Story 2.4: Dynamic sorting
    const sortByColumn = {
      date: costs.date,
      amount: costs.amount,
      contact: contacts.firstName,
      category: categories.displayName,
    }[input.sortBy]

    const sortDirection = input.sortDirection === "asc" ? asc : desc

    // Fetch costs with category and contact information
    const projectCosts = await ctx.db
      .select({
        cost: costs,
        category: categories,
        contact: contacts,
      })
      .from(costs)
      .leftJoin(categories, eq(costs.categoryId, categories.id))
      .leftJoin(contacts, eq(costs.contactId, contacts.id))
      .where(and(...conditions))
      .orderBy(sortDirection(sortByColumn))

    return projectCosts.map(({ cost, category, contact }) => ({
      ...cost,
      category: category ?? null,
      contact: contact ?? null,
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
    const total = projectCosts.reduce((sum, cost) => sum + cost.amount, 0)

    return { total }
  }),

  /**
   * Get costs grouped by contact for a project
   *
   * Returns costs organized by contact with totals per contact
   * Includes orphaned costs (no contact assigned)
   */
  getCostsByContact: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project ownership
      await verifyProjectOwnership(ctx.db, input.projectId, userId)

      // Fetch all costs with contact and category information
      const projectCosts = await ctx.db
        .select({
          cost: costs,
          contact: contacts,
          category: categories,
        })
        .from(costs)
        .leftJoin(contacts, eq(costs.contactId, contacts.id))
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(and(eq(costs.projectId, input.projectId), isNull(costs.deletedAt)))
        .orderBy(costs.date)

      // Group costs by contact
      const grouped = projectCosts.reduce(
        (acc, { cost, contact, category }) => {
          const contactId = cost.contactId ?? "unassigned"
          const contactName = contact
            ? `${contact.firstName}${contact.lastName ? " " + contact.lastName : ""}`
            : "Unassigned"

          if (!acc[contactId]) {
            acc[contactId] = {
              contactId: cost.contactId,
              contactName,
              contactCategory: contact?.categoryId ?? null,
              costs: [],
              total: 0,
            }
          }

          acc[contactId].costs.push({
            ...cost,
            category: category ?? null,
          })
          acc[contactId].total += cost.amount

          return acc
        },
        {} as Record<
          string,
          {
            contactId: string | null
            contactName: string
            contactCategory: string | null
            costs: Array<
              typeof costs.$inferSelect & { category: typeof categories.$inferSelect | null }
            >
            total: number
          }
        >
      )

      // Convert to array and sort by total (descending)
      return Object.values(grouped).sort((a, b) => b.total - a.total)
    }),

  /**
   * Get spending summary for a specific contact
   *
   * Returns total spending and breakdown by project and category
   */
  getContactSpending: protectedProcedure
    .input(z.object({ contactId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Fetch all costs for this contact with project and category info
      const contactCosts = await ctx.db
        .select({
          cost: costs,
          project: projects,
          category: categories,
        })
        .from(costs)
        .innerJoin(projects, eq(costs.projectId, projects.id))
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(
          and(
            eq(costs.contactId, input.contactId),
            eq(projects.ownerId, userId),
            isNull(costs.deletedAt),
            isNull(projects.deletedAt)
          )
        )

      // Calculate totals
      const totalSpending = contactCosts.reduce((sum, { cost }) => sum + cost.amount, 0)

      // Group by project
      const projectBreakdown = contactCosts.reduce(
        (acc, { cost, project }) => {
          if (!acc[project.id]) {
            acc[project.id] = {
              projectId: project.id,
              projectName: project.name,
              total: 0,
            }
          }
          acc[project.id].total += cost.amount
          return acc
        },
        {} as Record<string, { projectId: string; projectName: string; total: number }>
      )

      // Group by category
      const categoryBreakdown = contactCosts.reduce(
        (acc, { cost, category }) => {
          if (!category) return acc

          if (!acc[category.id]) {
            acc[category.id] = {
              categoryId: category.id,
              categoryName: category.displayName,
              total: 0,
            }
          }
          acc[category.id].total += cost.amount
          return acc
        },
        {} as Record<string, { categoryId: string; categoryName: string; total: number }>
      )

      return {
        totalSpending,
        projectBreakdown: Object.values(projectBreakdown),
        categoryBreakdown: Object.values(categoryBreakdown),
      }
    }),

  /**
   * Get orphaned costs (no contact assigned) for a project
   *
   * Returns all costs without a contactId
   */
  getOrphanedCosts: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project ownership
      await verifyProjectOwnership(ctx.db, input.projectId, userId)

      // Fetch orphaned costs with category information
      const orphanedCosts = await ctx.db
        .select({
          cost: costs,
          category: categories,
        })
        .from(costs)
        .leftJoin(categories, eq(costs.categoryId, categories.id))
        .where(
          and(
            eq(costs.projectId, input.projectId),
            isNull(costs.contactId),
            isNull(costs.deletedAt)
          )
        )
        .orderBy(costs.date)

      return orphanedCosts.map(({ cost, category }) => ({
        ...cost,
        category: category ?? null,
      }))
    }),

  /**
   * Bulk assign contact to multiple costs
   *
   * Updates contactId for multiple costs in a single transaction
   * Returns count of updated costs
   */
  bulkAssignContact: protectedProcedure
    .input(
      z.object({
        costIds: z.array(z.string().uuid()).min(1, "At least one cost must be selected"),
        contactId: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify all costs exist and user has access via project ownership
      const costsToUpdate = await ctx.db
        .select({
          cost: costs,
          project: projects,
        })
        .from(costs)
        .innerJoin(projects, eq(costs.projectId, projects.id))
        .where(
          and(inArray(costs.id, input.costIds), isNull(costs.deletedAt), isNull(projects.deletedAt))
        )

      // Verify all costs belong to user's projects
      const unauthorizedCosts = costsToUpdate.filter((c) => c.project.ownerId !== userId)
      if (unauthorizedCosts.length > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update these costs",
        })
      }

      // Verify found all costs
      if (costsToUpdate.length !== input.costIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some costs were not found",
        })
      }

      // Update all costs
      await ctx.db
        .update(costs)
        .set({
          contactId: input.contactId,
          updatedAt: new Date(),
        })
        .where(inArray(costs.id, input.costIds))

      return { count: costsToUpdate.length }
    }),
})
