/**
 * Netlify Blobs storage configuration
 *
 * Provides utilities for uploading, downloading, and managing files
 * in Netlify Blobs storage for construction documents and photos.
 */

import { getStore } from "@netlify/blobs"

/**
 * Get the Netlify Blobs store instance
 * Store name: 'project-files' for organizing all project-related uploads
 */
function getBlobStore() {
  return getStore({
    name: "project-files",
    consistency: "strong", // Ensure immediate consistency for file operations
  })
}

/**
 * Upload a file to Netlify Blobs storage
 *
 * @param pathname - The path/key where the file should be stored
 * @param body - The file content (string, ArrayBuffer, Blob, or ReadableStream)
 * @param options - Additional upload options
 * @returns Promise with blob URL and metadata
 * @throws Error if blob storage is not configured
 */
export async function uploadFile(
  pathname: string,
  body: string | ArrayBuffer | Blob,
  options?: {
    contentType?: string
    metadata?: Record<string, string>
  }
) {
  try {
    const store = getBlobStore()

    // Upload file to Netlify Blobs
    await store.set(pathname, body, {
      metadata: {
        contentType: options?.contentType || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        ...options?.metadata,
      },
    })

    return {
      pathname,
      uploadedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Failed to upload file to Netlify Blobs:", error)
    throw error
  }
}

/**
 * Delete a file from Netlify Blobs storage
 *
 * @param pathname - The blob pathname/key to delete
 * @throws Error if blob storage is not configured
 */
export async function deleteFile(pathname: string) {
  try {
    const store = getBlobStore()
    await store.delete(pathname)
  } catch (error) {
    console.error("Failed to delete file from Netlify Blobs:", error)
    throw error
  }
}

/**
 * List files in Netlify Blobs storage with optional prefix filter
 *
 * @param prefix - Optional prefix to filter files (e.g., "projects/project-id/")
 * @returns Promise with array of blob entries
 * @throws Error if blob storage is not configured
 */
export async function listFiles(prefix?: string) {
  try {
    const store = getBlobStore()
    const { blobs } = await store.list({
      prefix: prefix || "",
    })

    return blobs
  } catch (error) {
    console.error("Failed to list files from Netlify Blobs:", error)
    throw error
  }
}

/**
 * Get a file from Netlify Blobs storage
 *
 * @param pathname - The blob pathname/key
 * @returns Promise with file content
 * @throws Error if blob storage is not configured or file not found
 */
export async function getFile(pathname: string) {
  try {
    const store = getBlobStore()
    const content = await store.get(pathname)

    if (!content) {
      throw new Error(`File not found: ${pathname}`)
    }

    return content
  } catch (error) {
    console.error("Failed to get file from Netlify Blobs:", error)
    throw error
  }
}

/**
 * Get metadata for a specific file
 *
 * @param pathname - The blob pathname/key
 * @returns Promise with blob metadata
 * @throws Error if blob storage is not configured or file not found
 */
export async function getFileMetadata(pathname: string) {
  try {
    const store = getBlobStore()
    const metadata = await store.getMetadata(pathname)

    if (!metadata) {
      throw new Error(`File not found: ${pathname}`)
    }

    return metadata
  } catch (error) {
    console.error("Failed to get file metadata from Netlify Blobs:", error)
    throw error
  }
}

/**
 * Get file with metadata
 *
 * @param pathname - The blob pathname/key
 * @returns Promise with file data and metadata
 */
export async function getFileWithMetadata(pathname: string) {
  try {
    const store = getBlobStore()
    const result = await store.getWithMetadata(pathname)

    if (!result) {
      throw new Error(`File not found: ${pathname}`)
    }

    return result
  } catch (error) {
    console.error("Failed to get file with metadata from Netlify Blobs:", error)
    throw error
  }
}

/**
 * Generate a unique filename with timestamp and random suffix
 *
 * @param originalName - Original filename
 * @param projectId - Project ID for organizing files
 * @returns Unique pathname for blob storage
 */
export function generateBlobPathname(originalName: string, projectId: string): string {
  const timestamp = Date.now()
  const extension = originalName.split(".").pop()
  const nameWithoutExt = originalName.replace(`.${extension}`, "")
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "-")

  return `projects/${projectId}/${sanitizedName}-${timestamp}.${extension}`
}
