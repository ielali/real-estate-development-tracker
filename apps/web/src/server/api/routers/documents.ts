import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull, desc, asc } from "drizzle-orm"
import crypto from "crypto"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { documents } from "@/server/db/schema/documents"
import { projects } from "@/server/db/schema/projects"
import { auditLog } from "@/server/db/schema/auditLog"
import { costs } from "@/server/db/schema/costs"
import { events } from "@/server/db/schema/events"
import { costDocuments } from "@/server/db/schema/costDocuments"
import { contactDocuments } from "@/server/db/schema/contactDocuments"
import { eventDocuments } from "@/server/db/schema/eventDocuments"
import { projectContact } from "@/server/db/schema/projectContact"
import { documentService, bufferToArrayBuffer } from "@/server/services/document.service"
import { validateDocumentCategory } from "@/server/db/validate-document-category"
import { verifyProjectAccess } from "../helpers/verifyProjectAccess"

/**
 * Zod schema for file upload validation
 */
const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB"),
  type: z.string(),
  data: z.string(), // Base64 encoded file data
})

/**
 * Zod schema for document upload mutation
 */
const uploadDocumentSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().min(1, "Category is required"),
  file: fileSchema,
})

/**
 * Zod schema for listing documents by project
 */
const listDocumentsSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  categoryId: z.string().optional(),
  sortBy: z.enum(["date-desc", "date-asc", "name-asc", "size-desc"]).default("date-desc"),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
})

/**
 * Zod schema for deleting a document
 */
const deleteDocumentSchema = z.string().uuid("Invalid document ID")

/**
 * Documents router with CRUD operations for document management
 *
 * Provides type-safe API endpoints for uploading, listing, and deleting
 * documents. All operations require authentication and enforce
 * project ownership-based access control.
 */
export const documentsRouter = createTRPCRouter({
  /**
   * Upload a document to a project
   *
   * Validates project ownership, uploads file to Netlify Blobs,
   * creates database record, and logs the action for audit trail.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own project
   * @throws {TRPCError} BAD_REQUEST - Invalid file (size/type)
   * @returns {Document} The newly created document record
   */
  upload: protectedProcedure.input(uploadDocumentSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Validate and normalize category ID (fixes common mistakes like "photo" → "photos")
    const validatedCategoryId = await validateDocumentCategory(input.categoryId)

    // Verify project ownership
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

    if (!project || project.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to upload documents to this project",
      })
    }

    // Generate document ID
    const documentId = crypto.randomUUID()

    // Convert base64 to ArrayBuffer for Netlify Blobs
    const base64Data = input.file.data.replace(/^data:.+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const fileBuffer = bufferToArrayBuffer(buffer)

    // Upload to Netlify Blobs via DocumentService
    const blobUrl = await documentService.upload(
      fileBuffer,
      {
        name: input.file.name,
        size: input.file.size,
        type: input.file.type,
      },
      documentId,
      input.projectId
    )

    // Generate thumbnail for the uploaded document
    // This happens asynchronously - we don't block the upload response
    const thumbnailUrl = await documentService.generateThumbnail(blobUrl, input.file.type)

    // Create document record in database
    const [document] = await ctx.db
      .insert(documents)
      .values({
        id: documentId,
        projectId: input.projectId,
        fileName: input.file.name,
        fileSize: input.file.size,
        mimeType: input.file.type,
        blobUrl: blobUrl,
        thumbnailUrl: thumbnailUrl,
        categoryId: validatedCategoryId, // Use validated category ID
        uploadedById: userId,
      })
      .returning()

    // Create audit log entry
    await ctx.db.insert(auditLog).values({
      userId: userId,
      action: "uploaded",
      entityType: "document",
      entityId: document.id,
      metadata: JSON.stringify({
        fileName: document.fileName,
        fileSize: document.fileSize,
        projectId: input.projectId,
        displayName: `Uploaded ${document.fileName}`,
      }),
    })

    return document
  }),

  /**
   * List all documents for a project with filtering and sorting
   *
   * Returns non-deleted documents with optional category filtering,
   * custom sorting, and cursor-based pagination.
   * Verifies user has access to the project.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Object} Object with documents array and nextCursor for pagination
   */
  list: protectedProcedure.input(listDocumentsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project access (user must be owner)
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

    if (!project || project.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view documents for this project",
      })
    }

    // Build where conditions
    const whereConditions = [eq(documents.projectId, input.projectId), isNull(documents.deletedAt)]

    // Add category filter if specified
    if (input.categoryId) {
      whereConditions.push(eq(documents.categoryId, input.categoryId))
    }

    // Determine sort order based on sortBy parameter
    let orderByClause
    switch (input.sortBy) {
      case "date-desc":
        orderByClause = desc(documents.createdAt)
        break
      case "date-asc":
        orderByClause = asc(documents.createdAt)
        break
      case "name-asc":
        orderByClause = asc(documents.fileName)
        break
      case "size-desc":
        orderByClause = desc(documents.fileSize)
        break
      default:
        orderByClause = desc(documents.createdAt)
    }

    // Fetch documents with pagination (fetch one extra to determine if there's more)
    const projectDocuments = await ctx.db
      .select()
      .from(documents)
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(input.limit + 1)

    // Determine next cursor for pagination
    let nextCursor: string | undefined
    if (projectDocuments.length > input.limit) {
      const nextItem = projectDocuments.pop()
      nextCursor = nextItem?.id
    }

    return {
      documents: projectDocuments,
      nextCursor,
    }
  }),

  /**
   * Soft delete a document
   *
   * Sets deletedAt timestamp instead of removing from database.
   * Maintains data integrity and audit trail. Only project owner
   * can delete documents.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not own project
   * @throws {TRPCError} NOT_FOUND - Document not found
   * @returns {success: boolean} Deletion success status
   */
  delete: protectedProcedure.input(deleteDocumentSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Fetch document with project relationship
    const [document] = await ctx.db
      .select({
        document: documents,
        project: projects,
      })
      .from(documents)
      .innerJoin(projects, eq(documents.projectId, projects.id))
      .where(and(eq(documents.id, input), isNull(documents.deletedAt)))
      .limit(1)

    if (!document) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      })
    }

    // Verify project ownership
    if (document.project.ownerId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete this document",
      })
    }

    // Soft delete document
    await ctx.db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, input))

    // Create audit log entry
    await ctx.db.insert(auditLog).values({
      userId: userId,
      action: "deleted",
      entityType: "document",
      entityId: input,
      metadata: JSON.stringify({
        fileName: document.document.fileName,
        projectId: document.document.projectId,
        displayName: `Deleted ${document.document.fileName}`,
      }),
    })

    return { success: true }
  }),

  /**
   * Download a document with authorization check
   *
   * Fetches document from Netlify Blobs storage and returns as base64.
   * Verifies user has access to the document's project. Creates audit log entry.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} NOT_FOUND - Document not found
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Object} Object with base64 data, fileName, and mimeType
   */
  download: protectedProcedure
    .input(z.string().uuid("Invalid document ID"))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Fetch document with project relationship
      const [documentWithProject] = await ctx.db
        .select({
          document: documents,
          project: projects,
        })
        .from(documents)
        .innerJoin(projects, eq(documents.projectId, projects.id))
        .where(and(eq(documents.id, input), isNull(documents.deletedAt)))
        .limit(1)

      if (!documentWithProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        })
      }

      // Verify project access (user must be owner)
      if (documentWithProject.project.ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to download this document",
        })
      }

      // Fetch blob data from Netlify Blobs
      const blobData = await documentService.getDocumentBlob(documentWithProject.document.blobUrl)

      // Create audit log entry
      await ctx.db.insert(auditLog).values({
        userId: userId,
        action: "downloaded",
        entityType: "document",
        entityId: input,
        metadata: JSON.stringify({
          fileName: documentWithProject.document.fileName,
          projectId: documentWithProject.document.projectId,
          displayName: `Downloaded ${documentWithProject.document.fileName}`,
        }),
      })

      return {
        data: blobData,
        fileName: documentWithProject.document.fileName,
        mimeType: documentWithProject.document.mimeType,
      }
    }),

  /**
   * Get thumbnail image for a document with authorization check
   *
   * Fetches thumbnail from Netlify Blobs storage and returns as base64.
   * Verifies user has access to the document's project.
   * Returns placeholder icon path if thumbnail is not an actual blob key.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} NOT_FOUND - Document not found
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Object} Object with base64 data and mimeType, or placeholderPath
   */
  getThumbnail: protectedProcedure
    .input(z.string().uuid("Invalid document ID"))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Fetch document with project relationship
      const [documentWithProject] = await ctx.db
        .select({
          document: documents,
          project: projects,
        })
        .from(documents)
        .innerJoin(projects, eq(documents.projectId, projects.id))
        .where(and(eq(documents.id, input), isNull(documents.deletedAt)))
        .limit(1)

      if (!documentWithProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        })
      }

      // Verify project access (user must be owner)
      if (documentWithProject.project.ownerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this document",
        })
      }

      const thumbnailUrl = documentWithProject.document.thumbnailUrl

      // If no thumbnail URL, return error
      if (!thumbnailUrl) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thumbnail not found",
        })
      }

      // If thumbnail is a placeholder icon path, return it directly
      if (thumbnailUrl.startsWith("/icons/")) {
        return {
          placeholderPath: thumbnailUrl,
        }
      }

      // Fetch thumbnail blob data from Netlify Blobs
      const thumbnailData = await documentService.getDocumentBlob(thumbnailUrl)

      return {
        data: thumbnailData,
        mimeType: "image/jpeg", // Thumbnails are always JPEG
      }
    }),

  /**
   * Link documents to an entity (cost, event, or contact)
   *
   * Creates junction records linking multiple documents to a single entity.
   * Validates entity existence, project access, and document ownership.
   * Handles duplicate links gracefully via database unique constraints.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} NOT_FOUND - Entity not found
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @throws {TRPCError} BAD_REQUEST - Document not found in project
   * @returns {Object} Success status and number of links created
   */
  linkToEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["cost", "event", "contact"]),
        entityId: z.string().uuid(),
        documentIds: z.array(z.string().uuid()).min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, documentIds } = input
      const userId = ctx.session.user.id

      // 1. Verify entity exists and get project ID
      let projectId: string
      switch (entityType) {
        case "cost": {
          const [cost] = await ctx.db
            .select()
            .from(costs)
            .where(and(eq(costs.id, entityId), isNull(costs.deletedAt)))
            .limit(1)
          if (!cost) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cost not found" })
          }
          projectId = cost.projectId
          break
        }
        case "event": {
          const [event] = await ctx.db
            .select()
            .from(events)
            .where(and(eq(events.id, entityId), isNull(events.deletedAt)))
            .limit(1)
          if (!event) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
          }
          projectId = event.projectId
          break
        }
        case "contact": {
          // Contacts are global - verify via ProjectContact junction
          const [pc] = await ctx.db
            .select()
            .from(projectContact)
            .where(and(eq(projectContact.contactId, entityId), isNull(projectContact.deletedAt)))
            .limit(1)
          if (!pc) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" })
          }
          projectId = pc.projectId
          break
        }
      }

      // 2. Verify project access
      await verifyProjectAccess(ctx.db, userId, projectId)

      // 3. Verify all documents belong to same project
      for (const docId of documentIds) {
        const [doc] = await ctx.db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.id, docId),
              eq(documents.projectId, projectId),
              isNull(documents.deletedAt)
            )
          )
          .limit(1)

        if (!doc) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Document ${docId} not found in project`,
          })
        }
      }

      // 4. Create junction records
      const junctionTable =
        entityType === "cost"
          ? costDocuments
          : entityType === "event"
            ? eventDocuments
            : contactDocuments

      const foreignKeyField =
        entityType === "cost" ? "costId" : entityType === "event" ? "eventId" : "contactId"

      const values = documentIds.map((documentId) => ({
        id: crypto.randomUUID(),
        [foreignKeyField]: entityId,
        documentId: documentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }))

      const links = await ctx.db
        .insert(junctionTable)
        .values(values)
        .onConflictDoNothing()
        .returning()

      // 5. Create audit log
      await ctx.db.insert(auditLog).values({
        userId: userId,
        action: "linked",
        entityType: entityType,
        entityId: entityId,
        metadata: JSON.stringify({
          displayName: `Linked ${documentIds.length} document(s) to ${entityType}`,
          documentCount: documentIds.length,
        }),
      })

      return { success: true, linksCreated: links.length }
    }),

  /**
   * Unlink documents from an entity
   *
   * Soft deletes junction records for specified document-entity links.
   * Validates entity existence and project access.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} NOT_FOUND - Entity not found
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Object} Success status
   */
  unlinkFromEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["cost", "event", "contact"]),
        entityId: z.string().uuid(),
        documentIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { entityType, entityId, documentIds } = input
      const userId = ctx.session.user.id

      // 1. Verify entity exists and get project ID
      let projectId: string
      switch (entityType) {
        case "cost": {
          const [cost] = await ctx.db
            .select()
            .from(costs)
            .where(and(eq(costs.id, entityId), isNull(costs.deletedAt)))
            .limit(1)
          if (!cost) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cost not found" })
          }
          projectId = cost.projectId
          break
        }
        case "event": {
          const [event] = await ctx.db
            .select()
            .from(events)
            .where(and(eq(events.id, entityId), isNull(events.deletedAt)))
            .limit(1)
          if (!event) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" })
          }
          projectId = event.projectId
          break
        }
        case "contact": {
          const [pc] = await ctx.db
            .select()
            .from(projectContact)
            .where(and(eq(projectContact.contactId, entityId), isNull(projectContact.deletedAt)))
            .limit(1)
          if (!pc) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" })
          }
          projectId = pc.projectId
          break
        }
      }

      // 2. Verify project access
      await verifyProjectAccess(ctx.db, userId, projectId)

      // 3. Soft delete junction records
      // We need to update each junction record individually due to Drizzle's limitations with dynamic columns
      for (const documentId of documentIds) {
        if (entityType === "cost") {
          await ctx.db
            .update(costDocuments)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(costDocuments.costId, entityId),
                eq(costDocuments.documentId, documentId),
                isNull(costDocuments.deletedAt)
              )
            )
        } else if (entityType === "event") {
          await ctx.db
            .update(eventDocuments)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(eventDocuments.eventId, entityId),
                eq(eventDocuments.documentId, documentId),
                isNull(eventDocuments.deletedAt)
              )
            )
        } else {
          await ctx.db
            .update(contactDocuments)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(contactDocuments.contactId, entityId),
                eq(contactDocuments.documentId, documentId),
                isNull(contactDocuments.deletedAt)
              )
            )
        }
      }

      // 4. Create audit log
      await ctx.db.insert(auditLog).values({
        userId: userId,
        action: "unlinked",
        entityType: entityType,
        entityId: entityId,
        metadata: JSON.stringify({
          displayName: `Unlinked ${documentIds.length} document(s) from ${entityType}`,
          documentCount: documentIds.length,
        }),
      })

      return { success: true }
    }),

  /**
   * List orphaned documents (documents with no entity links)
   *
   * Finds documents that are not linked to any costs, events, or contacts.
   * Useful for cleanup operations to identify unused documents.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Array} Array of orphaned document records
   */
  listOrphaned: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: projectId }) => {
      const userId = ctx.session.user.id

      // Verify project access
      await verifyProjectAccess(ctx.db, userId, projectId)

      // Find all documents for project
      const allDocs = await ctx.db.query.documents.findMany({
        where: and(eq(documents.projectId, projectId), isNull(documents.deletedAt)),
        with: {
          costDocuments: {
            where: isNull(costDocuments.deletedAt),
          },
          eventDocuments: {
            where: isNull(eventDocuments.deletedAt),
          },
          contactDocuments: {
            where: isNull(contactDocuments.deletedAt),
          },
        },
      })

      // Filter to only orphaned documents (no active links)
      const orphaned = allDocs.filter(
        (doc) =>
          doc.costDocuments.length === 0 &&
          doc.eventDocuments.length === 0 &&
          doc.contactDocuments.length === 0
      )

      return orphaned
    }),
})
