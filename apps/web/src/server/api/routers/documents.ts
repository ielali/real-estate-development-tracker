import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull } from "drizzle-orm"
import crypto from "crypto"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { documents } from "@/server/db/schema/documents"
import { projects } from "@/server/db/schema/projects"
import { auditLog } from "@/server/db/schema/auditLog"
import { documentService, bufferToArrayBuffer } from "@/server/services/document.service"

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
const listDocumentsSchema = z.string().uuid("Invalid project ID")

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
        thumbnailUrl: null, // Generated in Story 3.2
        categoryId: input.categoryId,
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
   * List all documents for a project
   *
   * Returns non-deleted documents ordered by creation date (newest first).
   * Verifies user has access to the project.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have project access
   * @returns {Document[]} Array of document records
   */
  list: protectedProcedure.input(listDocumentsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project access (user must be owner)
    const project = await ctx.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, input), eq(projects.ownerId, userId), isNull(projects.deletedAt)))
      .limit(1)

    if (!project || project.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view documents for this project",
      })
    }

    // Fetch non-deleted documents
    const projectDocuments = await ctx.db
      .select()
      .from(documents)
      .where(and(eq(documents.projectId, input), isNull(documents.deletedAt)))
      .orderBy(documents.createdAt)

    return projectDocuments
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
})
