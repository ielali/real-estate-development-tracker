import { TRPCError } from "@trpc/server"
import { eq, and, isNull, gte, lte, sql, or, isNotNull } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { categories } from "@/server/db/schema/categories"
import { costs } from "@/server/db/schema/costs"
import { projects } from "@/server/db/schema/projects"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { getCategoriesByType, type Category, type CategoryType } from "@/server/db/types"
import {
  createCategorySchema,
  archiveCategorySchema,
  listCategoriesSchema,
  categorySpendingSchema,
} from "@/lib/validations/category"
import type { Database } from "@/server/db"

/**
 * Helper function to verify project ownership or partner access
 * Throws FORBIDDEN error if user doesn't own the project or have accepted partner access
 */
async function verifyProjectOwnership(
  db: Database,
  projectId: string,
  userId: string
): Promise<void> {
  const result = await db
    .select({ project: projects })
    .from(projects)
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
        eq(projects.id, projectId),
        or(
          eq(projects.ownerId, userId), // User owns the project
          isNotNull(projectAccess.id) // OR user has accepted partner access
        ),
        isNull(projects.deletedAt)
      )
    )
    .limit(1)

  if (!result[0]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Project not found or you do not have permission to access it",
    })
  }
}

/**
 * Helper function to get all categories (predefined + custom)
 * Used internally by procedures that need category data
 */
async function getAllCategories(
  db: Database,
  type: CategoryType,
  includeArchived = false
): Promise<Category[]> {
  // Get predefined categories from CATEGORIES constant
  const predefined = getCategoriesByType(type)

  // Get custom categories from database
  const customCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, type),
        eq(categories.isCustom, true),
        includeArchived ? undefined : eq(categories.isArchived, false)
      )
    )

  // Convert custom categories to Category interface format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const custom: Category[] = customCategories.map((cat: any) => ({
    id: cat.id,
    type: cat.type as CategoryType,
    displayName: cat.displayName,
    parentId: cat.parentId,
    taxDeductible: cat.taxDeductible ?? null,
    taxCategory: cat.taxCategory as Category["taxCategory"],
    notes: cat.notes,
    isCustom: cat.isCustom,
    isArchived: cat.isArchived,
    createdById: cat.createdById,
    createdAt: cat.createdAt ? new Date(cat.createdAt) : null,
  }))

  // Add missing fields to predefined categories to match Category type
  const predefinedWithFields: Category[] = predefined.map((cat) => ({
    ...cat,
    createdById: null,
    createdAt: null,
  }))

  // Merge and return (predefined first, then custom)
  return [...predefinedWithFields, ...custom]
}

/**
 * Helper function to calculate spending breakdown by category
 * Used by getSpendingBreakdown and getExportData procedures
 */
async function calculateSpendingBreakdown(
  db: Database,
  input: {
    projectId: string
    startDate?: Date
    endDate?: Date
  }
) {
  // Build date filter conditions
  const dateConditions = []
  if (input.startDate) {
    dateConditions.push(gte(costs.date, input.startDate))
  }
  if (input.endDate) {
    dateConditions.push(lte(costs.date, input.endDate))
  }

  // Query costs with category info
  const projectCosts = await db
    .select({
      categoryId: costs.categoryId,
      amount: costs.amount,
    })
    .from(costs)
    .where(and(eq(costs.projectId, input.projectId), isNull(costs.deletedAt), ...dateConditions))

  // Get all categories (predefined + custom)
  const allCategories = await getAllCategories(db, "cost", true)

  // Create category lookup map
  const categoryMap = new Map<string, Category>()
  allCategories.forEach((cat) => categoryMap.set(cat.id, cat))

  // Group costs by parent category
  const parentGroups: Record<
    string,
    {
      parentCategory: Category
      children: Record<
        string,
        {
          category: Category
          totalSpent: number
          costCount: number
        }
      >
      totalSpent: number
      taxDeductibleTotal: number
      nonDeductibleTotal: number
    }
  > = {}

  // Process each cost
  projectCosts.forEach(({ categoryId, amount }: { categoryId: string; amount: number }) => {
    const category = categoryMap.get(categoryId)
    if (!category) return

    // Find parent category
    const parentId = category.parentId ?? categoryId
    const parentCategory = categoryMap.get(parentId)
    if (!parentCategory) return

    // Initialize parent group if needed
    if (!parentGroups[parentId]) {
      parentGroups[parentId] = {
        parentCategory,
        children: {},
        totalSpent: 0,
        taxDeductibleTotal: 0,
        nonDeductibleTotal: 0,
      }
    }

    // Initialize child category if needed
    if (!parentGroups[parentId].children[categoryId]) {
      parentGroups[parentId].children[categoryId] = {
        category,
        totalSpent: 0,
        costCount: 0,
      }
    }

    // Add to totals
    parentGroups[parentId].children[categoryId].totalSpent += amount
    parentGroups[parentId].children[categoryId].costCount += 1
    parentGroups[parentId].totalSpent += amount

    // Track tax deductibility
    if (category.taxDeductible === true) {
      parentGroups[parentId].taxDeductibleTotal += amount
    } else if (category.taxDeductible === false) {
      parentGroups[parentId].nonDeductibleTotal += amount
    }
  })

  // Convert to array and sort by spending (descending)
  const breakdown = Object.values(parentGroups)
    .map((group) => ({
      parentCategory: group.parentCategory,
      childCategories: Object.values(group.children),
      totalSpent: group.totalSpent,
      taxDeductibleTotal: group.taxDeductibleTotal,
      nonDeductibleTotal: group.nonDeductibleTotal,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)

  return breakdown
}

/**
 * Category router with procedures for managing categories
 *
 * Handles both predefined categories (from CATEGORIES constant) and
 * custom user-created categories (from database).
 */
export const categoryRouter = createTRPCRouter({
  /**
   * List all categories (predefined + custom) for a specific type
   *
   * Merges predefined categories from constants with custom categories
   * from database. Custom categories are user-created and can be archived.
   */
  list: protectedProcedure.input(listCategoriesSchema).query(async ({ ctx, input }) => {
    return getAllCategories(ctx.db, input.type, input.includeArchived)
  }),

  /**
   * Create custom category with tax metadata
   *
   * Validates input, generates unique ID, checks for duplicates,
   * and enforces rate limiting (max 50 custom categories per user).
   */
  create: protectedProcedure.input(createCategorySchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Generate unique ID from displayName
    const id = `custom_${input.displayName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`

    // Check for duplicate ID
    const existing = await ctx.db.select().from(categories).where(eq(categories.id, id)).limit(1)

    if (existing.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A category with this name already exists",
      })
    }

    // Check rate limiting (max 50 custom categories per user)
    const userCategories = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(and(eq(categories.isCustom, true), eq(categories.createdById, userId)))

    const count = Number(userCategories[0]?.count ?? 0)
    if (count >= 50) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Maximum custom categories limit reached (50 per user)",
      })
    }

    // Insert custom category
    const [newCategory] = await ctx.db
      .insert(categories)
      .values({
        id,
        type: input.type,
        displayName: input.displayName,
        parentId: input.parentId,
        taxDeductible: input.taxDeductible ?? null,
        taxCategory: input.taxCategory ?? null,
        notes: input.notes ?? null,
        isCustom: true,
        isArchived: false,
        createdById: userId,
        createdAt: new Date(),
      })
      .returning()

    if (!newCategory) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create category",
      })
    }

    return {
      id: newCategory.id,
      type: newCategory.type as "contact" | "cost" | "document" | "event",
      displayName: newCategory.displayName,
      parentId: newCategory.parentId,
      taxDeductible: newCategory.taxDeductible,
      taxCategory: newCategory.taxCategory as Category["taxCategory"],
      notes: newCategory.notes,
      isCustom: newCategory.isCustom,
      isArchived: newCategory.isArchived,
      createdById: newCategory.createdById,
      createdAt: newCategory.createdAt ? new Date(newCategory.createdAt) : null,
    }
  }),

  /**
   * Archive custom category (soft delete)
   *
   * Prevents deletion if category has linked costs.
   * Only allows archiving of custom categories created by the user.
   */
  archive: protectedProcedure.input(archiveCategorySchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Check if category exists and is owned by user
    const category = await ctx.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, input.id),
          eq(categories.isCustom, true),
          eq(categories.createdById, userId)
        )
      )
      .limit(1)

    if (!category[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Category not found or you do not have permission to archive it",
      })
    }

    // Check if category has linked costs
    const linkedCosts = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(costs)
      .where(and(eq(costs.categoryId, input.id), isNull(costs.deletedAt)))

    const costCount = Number(linkedCosts[0]?.count ?? 0)
    if (costCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot archive category with ${costCount} linked costs. Archiving will hide it but preserve historical data.`,
      })
    }

    // Archive category
    await ctx.db.update(categories).set({ isArchived: true }).where(eq(categories.id, input.id))

    return { success: true }
  }),

  /**
   * Get category spending breakdown for project
   *
   * Returns costs grouped by parent category with child category breakdown.
   * Includes tax-deductible vs non-deductible subtotals.
   */
  getSpendingBreakdown: protectedProcedure
    .input(categorySpendingSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project ownership
      await verifyProjectOwnership(ctx.db, input.projectId, userId)

      return calculateSpendingBreakdown(ctx.db, input)
    }),

  /**
   * Generate category export data for CSV download
   *
   * Returns formatted data ready for CSV export with project metadata,
   * category hierarchy, and tax information.
   */
  getExportData: protectedProcedure.input(categorySpendingSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project ownership and get project info
    const project = await ctx.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.ownerId, userId),
          isNull(projects.deletedAt)
        )
      )
      .limit(1)

    if (!project[0]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project not found or you do not have permission to access it",
      })
    }

    // Get spending breakdown using helper function
    const breakdown = await calculateSpendingBreakdown(ctx.db, input)

    return {
      projectName: project[0].name,
      projectId: input.projectId,
      dateRange: {
        start: input.startDate ?? null,
        end: input.endDate ?? null,
      },
      generated: new Date(),
      breakdown,
    }
  }),
})
