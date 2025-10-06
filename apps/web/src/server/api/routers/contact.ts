import { TRPCError } from "@trpc/server"
import { eq, and, isNull, or, ilike, sql } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { contacts } from "@/server/db/schema/contacts"
import { categories } from "@/server/db/schema/categories"
import { projectContact } from "@/server/db/schema/projectContact"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { addresses } from "@/server/db/schema/addresses"
import {
  contactFormSchema,
  contactUpdateSchema,
  contactFilterSchema,
} from "@/lib/validations/contact"
import { z } from "zod"
import { getCategoryById } from "@/server/db/types"

/**
 * Contact router with CRUD operations for contact management
 *
 * All operations require authentication. Contacts are user-specific and
 * can be associated with multiple projects.
 */
export const contactRouter = createTRPCRouter({
  /**
   * Create a new contact
   *
   * Validates that:
   * - Category exists and is a contact category
   * - No duplicate contact exists (same firstName + lastName + company)
   * - Address ID is valid if provided
   */
  create: protectedProcedure.input(contactFormSchema).mutation(async ({ ctx, input }) => {
    // Verify category exists and is a contact category
    const category = await ctx.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), eq(categories.type, "contact")))
      .limit(1)

    if (!category[0]) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid contact category",
      })
    }

    // Check for duplicate contacts (same firstName + lastName + company)
    const duplicateQuery = [eq(contacts.firstName, input.firstName), isNull(contacts.deletedAt)]

    if (input.lastName) {
      duplicateQuery.push(eq(contacts.lastName, input.lastName))
    } else {
      duplicateQuery.push(isNull(contacts.lastName))
    }

    if (input.company) {
      duplicateQuery.push(eq(contacts.company, input.company))
    } else {
      duplicateQuery.push(isNull(contacts.company))
    }

    const duplicate = await ctx.db
      .select()
      .from(contacts)
      .where(and(...duplicateQuery))
      .limit(1)

    if (duplicate[0]) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A contact with this name and company already exists",
      })
    }

    // Verify address exists if addressId is provided
    if (input.addressId) {
      const address = await ctx.db
        .select()
        .from(addresses)
        .where(eq(addresses.id, input.addressId))
        .limit(1)

      if (!address[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid address ID",
        })
      }
    }

    // Create the contact
    const [newContact] = await ctx.db
      .insert(contacts)
      .values({
        firstName: input.firstName,
        lastName: input.lastName || null,
        company: input.company || null,
        email: input.email || null,
        phone: input.phone || null,
        mobile: input.mobile || null,
        addressId: input.addressId || null,
        categoryId: input.categoryId,
        notes: input.notes || null,
      })
      .returning()

    return newContact
  }),

  /**
   * List contacts with filtering and search
   *
   * Supports:
   * - Text search across firstName, lastName, and company
   * - Filter by category (child or parent category)
   * - Filter by project association
   */
  list: protectedProcedure.input(contactFilterSchema).query(async ({ ctx, input }) => {
    const conditions = [isNull(contacts.deletedAt)]

    // Search filter (firstName, lastName, company)
    if (input.search) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${input.search}%`),
          ilike(contacts.lastName, `%${input.search}%`),
          ilike(contacts.company, `%${input.search}%`)
        )!
      )
    }

    // Category filter (supports both parent and child categories)
    if (input.categoryId) {
      conditions.push(eq(contacts.categoryId, input.categoryId))
    } else if (input.parentCategoryId) {
      // Get all child categories for this parent
      const category = getCategoryById(input.parentCategoryId)
      if (category) {
        const childCategories = await ctx.db
          .select()
          .from(categories)
          .where(
            and(eq(categories.parentId, input.parentCategoryId), eq(categories.type, "contact"))
          )

        const categoryIds = childCategories.map((c) => c.id)
        if (categoryIds.length > 0) {
          conditions.push(or(...categoryIds.map((id) => eq(contacts.categoryId, id)))!)
        } else {
          // No child categories found - return empty result by adding impossible condition
          conditions.push(sql`false`)
        }
      }
    }

    // Project filter (join with projectContact)
    if (input.projectId) {
      const contactsInProject = await ctx.db
        .select({
          contact: contacts,
          category: categories,
          address: addresses,
        })
        .from(contacts)
        .leftJoin(categories, eq(contacts.categoryId, categories.id))
        .leftJoin(addresses, eq(contacts.addressId, addresses.id))
        .innerJoin(projectContact, eq(contacts.id, projectContact.contactId))
        .where(
          and(
            ...conditions,
            eq(projectContact.projectId, input.projectId),
            isNull(projectContact.deletedAt)
          )
        )
        .orderBy(contacts.lastName, contacts.firstName)

      return contactsInProject
    }

    // Execute query without project filter
    const result = await ctx.db
      .select({
        contact: contacts,
        category: categories,
        address: addresses,
      })
      .from(contacts)
      .leftJoin(categories, eq(contacts.categoryId, categories.id))
      .leftJoin(addresses, eq(contacts.addressId, addresses.id))
      .where(and(...conditions))
      .orderBy(contacts.lastName, contacts.firstName)

    return result
  }),

  /**
   * Get a single contact by ID with related data
   *
   * Returns contact with:
   * - Category information
   * - Address information
   * - Related projects (via projectContact junction)
   * - Related costs with project information
   */
  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    const [contact] = await ctx.db
      .select({
        contact: contacts,
        category: categories,
        address: addresses,
      })
      .from(contacts)
      .leftJoin(categories, eq(contacts.categoryId, categories.id))
      .leftJoin(addresses, eq(contacts.addressId, addresses.id))
      .where(and(eq(contacts.id, input), isNull(contacts.deletedAt)))
      .limit(1)

    if (!contact) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contact not found",
      })
    }

    // Get related projects
    const relatedProjects = await ctx.db
      .select({
        projectContact: projectContact,
        project: projects,
      })
      .from(projectContact)
      .innerJoin(projects, eq(projectContact.projectId, projects.id))
      .where(
        and(
          eq(projectContact.contactId, input),
          isNull(projectContact.deletedAt),
          isNull(projects.deletedAt)
        )
      )

    // Get related costs with project information
    const relatedCosts = await ctx.db
      .select({
        cost: costs,
        project: projects,
      })
      .from(costs)
      .innerJoin(projects, eq(costs.projectId, projects.id))
      .where(and(eq(costs.contactId, input), isNull(costs.deletedAt), isNull(projects.deletedAt)))
      .orderBy(costs.date)

    return {
      ...contact,
      projects: relatedProjects,
      costs: relatedCosts,
    }
  }),

  /**
   * Update a contact
   *
   * Validates that:
   * - Contact exists and is not deleted
   * - Category is valid if being changed
   * - No duplicate would be created
   */
  update: protectedProcedure.input(contactUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input

    // Verify contact exists
    const [existing] = await ctx.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), isNull(contacts.deletedAt)))
      .limit(1)

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contact not found",
      })
    }

    // Verify category if being changed
    if (updateData.categoryId) {
      const category = await ctx.db
        .select()
        .from(categories)
        .where(and(eq(categories.id, updateData.categoryId), eq(categories.type, "contact")))
        .limit(1)

      if (!category[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid contact category",
        })
      }
    }

    // Check for duplicates if name or company is being changed
    if (updateData.firstName || updateData.lastName || updateData.company) {
      const duplicateQuery = [isNull(contacts.deletedAt), sql`${contacts.id} != ${id}`]

      duplicateQuery.push(eq(contacts.firstName, updateData.firstName || existing.firstName))

      const lastName = updateData.lastName !== undefined ? updateData.lastName : existing.lastName
      if (lastName) {
        duplicateQuery.push(eq(contacts.lastName, lastName))
      } else {
        duplicateQuery.push(isNull(contacts.lastName))
      }

      const company = updateData.company !== undefined ? updateData.company : existing.company
      if (company) {
        duplicateQuery.push(eq(contacts.company, company))
      } else {
        duplicateQuery.push(isNull(contacts.company))
      }

      const duplicate = await ctx.db
        .select()
        .from(contacts)
        .where(and(...duplicateQuery))
        .limit(1)

      if (duplicate[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A contact with this name and company already exists",
        })
      }
    }

    // Update the contact
    const [updated] = await ctx.db
      .update(contacts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning()

    return updated
  }),

  /**
   * Soft delete a contact
   *
   * Sets deletedAt timestamp. Related costs and project associations
   * are preserved for historical data integrity.
   */
  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
    // Verify contact exists
    const [existing] = await ctx.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, input), isNull(contacts.deletedAt)))
      .limit(1)

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contact not found",
      })
    }

    // Soft delete the contact
    const [deleted] = await ctx.db
      .update(contacts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, input))
      .returning()

    return deleted
  }),
})
