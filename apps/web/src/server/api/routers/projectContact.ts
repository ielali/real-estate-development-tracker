import { TRPCError } from "@trpc/server"
import { eq, and, isNull } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { projectContact } from "@/server/db/schema/projectContact"
import { projects } from "@/server/db/schema/projects"
import { contacts } from "@/server/db/schema/contacts"
import { projectContactSchema } from "@/lib/validations/contact"

/**
 * ProjectContact router for managing contact-project associations
 *
 * Handles linking and unlinking contacts to/from projects.
 * All operations verify project ownership before allowing modifications.
 */
export const projectContactRouter = createTRPCRouter({
  /**
   * Add a contact to a project
   *
   * Validates that:
   * - User owns the project
   * - Contact exists and is not deleted
   * - Association doesn't already exist
   */
  addToProject: protectedProcedure.input(projectContactSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project ownership
    const [project] = await ctx.db
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

    if (!project) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project not found or you do not have permission to access it",
      })
    }

    // Verify contact exists
    const [contact] = await ctx.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, input.contactId), isNull(contacts.deletedAt)))
      .limit(1)

    if (!contact) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Contact not found",
      })
    }

    // Check if association already exists (including soft-deleted ones)
    const [existing] = await ctx.db
      .select()
      .from(projectContact)
      .where(
        and(
          eq(projectContact.projectId, input.projectId),
          eq(projectContact.contactId, input.contactId)
        )
      )
      .limit(1)

    // If exists and is deleted, restore it
    if (existing && existing.deletedAt) {
      const [restored] = await ctx.db
        .update(projectContact)
        .set({
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(projectContact.id, existing.id))
        .returning()

      return restored
    }

    // If exists and not deleted, throw error
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Contact is already associated with this project",
      })
    }

    // Create new association
    const [newAssociation] = await ctx.db
      .insert(projectContact)
      .values({
        projectId: input.projectId,
        contactId: input.contactId,
      })
      .returning()

    return newAssociation
  }),

  /**
   * Remove a contact from a project (soft delete)
   *
   * Validates that:
   * - User owns the project
   * - Association exists
   */
  removeFromProject: protectedProcedure
    .input(projectContactSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project ownership
      const [project] = await ctx.db
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

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or you do not have permission to access it",
        })
      }

      // Find the association
      const [association] = await ctx.db
        .select()
        .from(projectContact)
        .where(
          and(
            eq(projectContact.projectId, input.projectId),
            eq(projectContact.contactId, input.contactId),
            isNull(projectContact.deletedAt)
          )
        )
        .limit(1)

      if (!association) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contact is not associated with this project",
        })
      }

      // Soft delete the association
      const [removed] = await ctx.db
        .update(projectContact)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projectContact.id, association.id))
        .returning()

      return removed
    }),

  /**
   * List all contacts for a specific project
   *
   * Validates that user owns the project
   */
  listForProject: protectedProcedure
    .input(projectContactSchema.pick({ projectId: true }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project ownership
      const [project] = await ctx.db
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

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project not found or you do not have permission to access it",
        })
      }

      // Get all contacts for this project
      const projectContacts = await ctx.db
        .select({
          projectContact: projectContact,
          contact: contacts,
        })
        .from(projectContact)
        .innerJoin(contacts, eq(projectContact.contactId, contacts.id))
        .where(
          and(
            eq(projectContact.projectId, input.projectId),
            isNull(projectContact.deletedAt),
            isNull(contacts.deletedAt)
          )
        )
        .orderBy(contacts.lastName, contacts.firstName)

      return projectContacts
    }),
})
