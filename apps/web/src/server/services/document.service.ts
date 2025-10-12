import { getStore, getDeployStore } from "@netlify/blobs"
import { TRPCError } from "@trpc/server"
import sharp from "sharp"

/**
 * File metadata extracted during upload validation
 */
export interface FileMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  isValid: boolean
  error?: string
}

/**
 * Supported MIME types for document uploads
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
]

/**
 * Maximum file size: 10MB in bytes
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Convert Node.js Buffer to ArrayBuffer
 * Netlify Blobs accepts ArrayBuffer, not Node.js Buffer
 */
export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
}

/**
 * Get the appropriate blob store based on environment
 *
 * - Production: Uses global store (persistent across deploys)
 * - Non-production: Uses deploy-scoped store (isolated per branch/deploy)
 *
 * This prevents test/dev data from contaminating production storage.
 */
function getBlobStore(storeName: string) {
  // Check if we're in production context via Netlify environment
  const isProduction = process.env.CONTEXT === "production"

  if (isProduction) {
    // Production: Use global store with strong consistency for critical data
    return getStore({ name: storeName, consistency: "strong" })
  }

  // Non-production: Use deploy-scoped store to isolate test data
  return getDeployStore(storeName)
}

/**
 * DocumentService - Handles file upload processing and validation
 *
 * Provides file upload to Netlify Blobs, metadata extraction,
 * and validation for document uploads in real estate projects.
 *
 * Storage Strategy:
 * - Production: Global store with strong consistency
 * - Development/Preview: Deploy-scoped store for data isolation
 *
 * Note: The blob store is lazy-initialized to avoid errors when
 * Netlify environment is not available at module load time.
 */
export class DocumentService {
  private _store: ReturnType<typeof getStore> | null = null

  /**
   * Get or initialize the blob store
   * Lazy initialization prevents errors when Netlify environment isn't ready
   */
  private get store(): ReturnType<typeof getStore> {
    if (!this._store) {
      try {
        this._store = getBlobStore("documents")
      } catch (error) {
        // Provide helpful error message if Netlify Blobs isn't configured
        if (error instanceof Error && error.message.includes("MissingBlobsEnvironmentError")) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Netlify Blobs is not configured. Please run 'netlify dev' instead of 'npm run dev' for local development.",
          })
        }
        throw error
      }
    }
    return this._store
  }

  /**
   * Process and validate file metadata
   *
   * @param file - File object with name, size, and type
   * @returns FileMetadata with validation result
   */
  processMetadata(file: { name: string; size: number; type: string }): FileMetadata {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isValid: false,
        error: "File size must be under 10MB",
      }
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isValid: false,
        error: "File type not supported. Please upload images, PDFs, or documents.",
      }
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      isValid: true,
    }
  }

  /**
   * Upload file to Netlify Blobs storage
   *
   * Validates file before upload and stores in Netlify Blobs.
   * Returns the blob key for database storage.
   *
   * @param fileBuffer - File content as string, ArrayBuffer, or Blob
   * @param metadata - File metadata (name, size, type)
   * @param documentId - Unique document ID (UUID) for blob storage key
   * @param projectId - Project ID for blob metadata
   * @returns Blob key for accessing the uploaded file
   * @throws {TRPCError} BAD_REQUEST - Invalid file size or type
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - Upload failure
   */
  async upload(
    fileBuffer: string | ArrayBuffer | Blob,
    metadata: { name: string; size: number; type: string },
    documentId: string,
    projectId: string
  ): Promise<string> {
    // Validate file metadata
    const fileMetadata = this.processMetadata(metadata)
    if (!fileMetadata.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: fileMetadata.error,
      })
    }

    try {
      // Upload to Netlify Blobs
      // Note: Netlify Blobs accepts string, ArrayBuffer, or Blob
      await this.store.set(documentId, fileBuffer, {
        metadata: {
          fileName: metadata.name,
          mimeType: metadata.type,
          projectId: projectId,
          uploadedAt: new Date().toISOString(),
        },
      })

      // Return the blob key (documentId)
      // The key will be used to retrieve the blob later via store.get()
      return documentId
    } catch (error) {
      console.error("Document upload failed:", error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload document. Please try again.",
      })
    }
  }

  /**
   * Get blob content from Netlify Blobs storage
   *
   * @param documentId - Unique document ID (UUID) used as blob key
   * @returns Blob content
   * @throws {TRPCError} NOT_FOUND - Blob not found
   */
  async get(documentId: string): Promise<string | null> {
    try {
      const blob = await this.store.get(documentId)
      return blob
    } catch (error) {
      console.error("Failed to retrieve blob:", error)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      })
    }
  }

  /**
   * Delete blob from Netlify Blobs storage
   *
   * @param documentId - Unique document ID (UUID) used as blob key
   */
  async delete(documentId: string): Promise<void> {
    try {
      await this.store.delete(documentId)
    } catch (error) {
      console.error("Failed to delete blob:", error)
      // Don't throw error on delete failure - blob might already be deleted
    }
  }

  /**
   * Generate thumbnail for image documents
   *
   * Creates a 200x200px thumbnail from the source image and stores it
   * in Netlify Blobs with a -thumb suffix. Returns the thumbnail blob key.
   *
   * For non-image files, returns placeholder icon paths.
   *
   * @param blobKey - Blob key of the original document
   * @param mimeType - MIME type of the document
   * @returns Thumbnail blob key or placeholder icon path
   * @throws {TRPCError} INTERNAL_SERVER_ERROR - Thumbnail generation failure
   */
  async generateThumbnail(blobKey: string, mimeType: string): Promise<string> {
    // Check if file is an image
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"]

    if (!imageTypes.includes(mimeType)) {
      // Return placeholder icons for non-images
      if (mimeType === "application/pdf") {
        return "/icons/pdf-placeholder.svg"
      }
      if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        return "/icons/doc-placeholder.svg"
      }
      return "/icons/file-placeholder.svg"
    }

    try {
      // 1. Fetch original image from Netlify Blobs
      const imageData = await this.store.get(blobKey)
      if (!imageData) {
        throw new Error("Original image not found")
      }

      // Convert blob data to buffer for Sharp processing
      // Netlify Blobs returns data as string, need to convert to Buffer
      const imageBuffer = Buffer.from(imageData, "base64")

      // 2. Generate thumbnail using Sharp (200x200px max, maintain aspect ratio)
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(200, 200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()

      // 3. Upload thumbnail to Netlify Blobs with -thumb suffix
      const thumbnailKey = `${blobKey}-thumb`
      await this.store.set(thumbnailKey, bufferToArrayBuffer(thumbnailBuffer), {
        metadata: {
          originalBlobKey: blobKey,
          thumbnailSize: "200x200",
          generatedAt: new Date().toISOString(),
        },
      })

      // 4. Return thumbnail blob key
      return thumbnailKey
    } catch (error) {
      console.error("Thumbnail generation failed:", error)
      // On failure, return default file placeholder
      return "/icons/file-placeholder.svg"
    }
  }

  /**
   * Get document blob for download with authorization
   *
   * Fetches the document blob from Netlify Blobs storage.
   * Authorization must be checked by the caller (tRPC procedure).
   *
   * @param blobKey - Blob key of the document
   * @returns Object with data as string (base64 or text)
   * @throws {TRPCError} NOT_FOUND - Document blob not found
   */
  async getDocumentBlob(blobKey: string): Promise<string> {
    try {
      const data = await this.store.get(blobKey)
      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found in storage",
        })
      }

      return data
    } catch (error) {
      console.error("Failed to retrieve document blob:", error)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found",
      })
    }
  }
}

/**
 * Singleton instance of DocumentService
 */
export const documentService = new DocumentService()
