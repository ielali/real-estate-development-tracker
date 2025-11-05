import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull, desc, gte, lte } from "drizzle-orm"
import crypto from "crypto"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { events } from "@/server/db/schema/events"
import { eventContacts } from "@/server/db/schema/eventContacts"
import { eventDocuments } from "@/server/db/schema/eventDocuments"
import { documents } from "@/server/db/schema/documents"
import { projects } from "@/server/db/schema/projects"
import { auditLog } from "@/server/db/schema/auditLog"
import { verifyProjectAccess } from "../helpers/verifyProjectAccess"
import { notifyTimelineEvent } from "@/server/services/notifications"

/**
 * Zod schema for creating an event
 */
const createEventSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  description: z.string().optional(),
  date: z.coerce.date(),
  categoryId: z.enum(["milestone", "meeting", "inspection"]),
  relatedContactIds: z.array(z.string().uuid()).default([]),
})

/**
 * Zod schema for listing events
 */
const listEventsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().optional(),
  contactId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
})

/**
 * Zod schema for updating an event
 */
const updateEventSchema = z.object({
  id: z.string().uuid("Invalid event ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be under 200 characters")
    .optional(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  categoryId: z.enum(["milestone", "meeting", "inspection"]).optional(),
  relatedContactIds: z.array(z.string().uuid()).optional(),
})

/**
 * Zod schema for deleting an event
 */
const deleteEventSchema = z.string().uuid("Invalid event ID")

/**
 * Events router with CRUD operations for project event tracking
 *
 * Provides type-safe API endpoints for creating, listing, updating,
 * and deleting project events. All operations require authentication
 * and enforce project access control (owner or partner).
 */
export const eventsRouter = createTRPCRouter({
  /**
   * Create a new event
   *
   * Validates project access, creates event record, links contacts
   * via junction table, and creates audit log entry.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to project
   * @throws {TRPCError} BAD_REQUEST - Invalid input data
   * @returns {Event} The newly created event record
   */
  create: protectedProcedure.input(createEventSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project access
    await verifyProjectAccess(ctx.db, input.projectId, userId)

    // Get project name for notification
    const [project] = await ctx.db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    // Generate event ID
    const eventId = crypto.randomUUID()

    // Create event record
    const [event] = await ctx.db
      .insert(events)
      .values({
        id: eventId,
        projectId: input.projectId,
        title: input.title,
        description: input.description || null,
        date: input.date,
        categoryId: input.categoryId,
        createdById: userId,
      })
      .returning()

    // Create junction records for related contacts (deduplicate contact IDs)
    if (input.relatedContactIds && input.relatedContactIds.length > 0) {
      const uniqueContactIds = Array.from(new Set(input.relatedContactIds))
      await ctx.db.insert(eventContacts).values(
        uniqueContactIds.map((contactId) => ({
          id: crypto.randomUUID(),
          eventId: eventId,
          contactId: contactId,
        }))
      )
    }

    // Create audit log entry
    await ctx.db.insert(auditLog).values({
      userId: userId,
      action: "created",
      entityType: "event",
      entityId: event.id,
      metadata: JSON.stringify({
        displayName: `Created event: ${input.title}`,
        eventTitle: input.title,
        eventDate: input.date.toISOString(),
        category: input.categoryId,
      }),
    })

    // Send notification (Story 8.1: AC #10, #11)
    await notifyTimelineEvent({
      projectId: input.projectId,
      eventId: event.id,
      eventTitle: event.title,
      projectName: project.name,
      excludeUserId: userId,
    })

    return event
  }),

  /**
   * List events for a project with filtering and pagination
   *
   * Supports filtering by category, contact, and date range.
   * Returns events in chronological order (newest first).
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to project
   * @returns {Object} Events list with pagination cursor
   */
  list: protectedProcedure.input(listEventsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project access
    await verifyProjectAccess(ctx.db, input.projectId, userId)

    // Build where conditions
    const conditions = [eq(events.projectId, input.projectId), isNull(events.deletedAt)]

    if (input.categoryId) {
      conditions.push(eq(events.categoryId, input.categoryId))
    }

    if (input.startDate) {
      conditions.push(gte(events.date, input.startDate))
    }

    if (input.endDate) {
      conditions.push(lte(events.date, input.endDate))
    }

    // Query events with relations
    const eventsList = await ctx.db.query.events.findMany({
      where: and(...conditions),
      orderBy: [desc(events.date)],
      limit: input.limit + 1, // Fetch one extra for cursor pagination
      with: {
        category: true,
        createdBy: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        eventContacts: {
          where: input.contactId
            ? and(eq(eventContacts.contactId, input.contactId), isNull(eventContacts.deletedAt))
            : isNull(eventContacts.deletedAt),
          with: {
            contact: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    })

    // Filter out deleted contacts from eventContacts
    const eventsWithActiveContacts = eventsList.map((event: any) => ({
      // eslint-disable-line @typescript-eslint/no-explicit-any
      ...event,
      eventContacts: event.eventContacts.filter((ec: any) => !ec.contact.deletedAt), // eslint-disable-line @typescript-eslint/no-explicit-any
    }))

    // Filter events that have the specified contact (if contactId provided)
    const filteredEvents = input.contactId
      ? eventsWithActiveContacts.filter((event: any) => event.eventContacts.length > 0) // eslint-disable-line @typescript-eslint/no-explicit-any
      : eventsWithActiveContacts

    // Determine next cursor for pagination
    let nextCursor: string | undefined
    if (filteredEvents.length > input.limit) {
      const nextItem = filteredEvents.pop()
      nextCursor = nextItem!.id
    }

    return {
      events: filteredEvents,
      nextCursor,
    }
  }),

  /**
   * Update an existing event
   *
   * Allows updating event details and related contacts.
   * Only accessible to users with project access.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to project
   * @throws {TRPCError} NOT_FOUND - Event not found
   * @returns {Event} The updated event record
   */
  update: protectedProcedure.input(updateEventSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Find event and verify it exists
    const existingEvent = await ctx.db
      .select()
      .from(events)
      .where(and(eq(events.id, input.id), isNull(events.deletedAt)))
      .limit(1)

    if (!existingEvent[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      })
    }

    // Verify project access
    await verifyProjectAccess(ctx.db, existingEvent[0].projectId, userId)

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (input.title) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.date) updateData.date = input.date
    if (input.categoryId) updateData.categoryId = input.categoryId

    // Update event record
    const [updatedEvent] = await ctx.db
      .update(events)
      .set(updateData)
      .where(eq(events.id, input.id))
      .returning()

    // Update contact relationships if provided
    if (input.relatedContactIds !== undefined) {
      // Soft delete existing contact links
      await ctx.db
        .update(eventContacts)
        .set({ deletedAt: new Date() })
        .where(and(eq(eventContacts.eventId, input.id), isNull(eventContacts.deletedAt)))

      // Create new contact links
      if (input.relatedContactIds.length > 0) {
        await ctx.db.insert(eventContacts).values(
          input.relatedContactIds.map((contactId) => ({
            id: crypto.randomUUID(),
            eventId: input.id,
            contactId: contactId,
          }))
        )
      }
    }

    // Create audit log entry
    await ctx.db.insert(auditLog).values({
      userId: userId,
      action: "updated",
      entityType: "event",
      entityId: updatedEvent.id,
      metadata: JSON.stringify({
        displayName: `Updated event: ${updatedEvent.title}`,
      }),
    })

    return updatedEvent
  }),

  /**
   * Delete an event (soft delete)
   *
   * Soft deletes the event to preserve audit trail.
   * Only accessible to project owner.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User is not project owner
   * @throws {TRPCError} NOT_FOUND - Event not found
   * @returns {Object} Success confirmation
   */
  delete: protectedProcedure.input(deleteEventSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Find event
    const existingEvent = await ctx.db
      .select()
      .from(events)
      .where(and(eq(events.id, input), isNull(events.deletedAt)))
      .limit(1)

    if (!existingEvent[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      })
    }

    // Verify user is project owner (only owner can delete)
    const project = await ctx.db
      .select()
      .from(projects)
      .where(eq(projects.id, existingEvent[0].projectId))
      .limit(1)

    if (!project[0] || project[0].ownerId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only project owner can delete events",
      })
    }

    // Soft delete event
    await ctx.db.update(events).set({ deletedAt: new Date() }).where(eq(events.id, input))

    // Create audit log entry
    await ctx.db.insert(auditLog).values({
      userId: userId,
      action: "deleted",
      entityType: "event",
      entityId: existingEvent[0].id,
      metadata: JSON.stringify({
        displayName: `Deleted event: ${existingEvent[0].title}`,
      }),
    })

    return { success: true }
  }),

  /**
   * Get all documents linked to a specific event
   *
   * Returns documents that have been associated with this event
   * (e.g., permits, approvals, meeting notes). Verifies user has access to the event's project.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have permission to access this event
   * @throws {TRPCError} NOT_FOUND - Event not found
   * @returns {Array} Array of linked document records
   */
  getDocuments: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: eventId }) => {
      const userId = ctx.session.user.id

      // Find event and verify access
      const [event] = await ctx.db.select().from(events).where(eq(events.id, eventId)).limit(1)

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
      }

      await verifyProjectAccess(ctx.db, event.projectId, userId)

      // Get linked documents via junction table
      const links = await ctx.db
        .select({
          document: documents,
          linkCreatedAt: eventDocuments.createdAt,
        })
        .from(eventDocuments)
        .innerJoin(documents, eq(eventDocuments.documentId, documents.id))
        .where(
          and(
            eq(eventDocuments.eventId, eventId),
            isNull(eventDocuments.deletedAt),
            isNull(documents.deletedAt)
          )
        )
        .orderBy(desc(eventDocuments.createdAt))

      return links.map((link: any) => link.document) // eslint-disable-line @typescript-eslint/no-explicit-any
    }),
})
