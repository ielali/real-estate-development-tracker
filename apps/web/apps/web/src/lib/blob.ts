/**
 * Vercel Blob storage configuration
 *
 * Provides utilities for uploading, downloading, and managing files
 * in Vercel Blob storage for construction documents and photos.
 */

import { put, del, list, head } from "@vercel/blob"

/**
 * Upload a file to Vercel Blob storage
 *
 * @param pathname - The path where the file should be stored
 * @param body - The file content (File, Blob, Buffer, or ReadableStream)
 * @param options - Additional upload options
 * @returns Promise with blob URL and metadata
 * @throws Error if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function uploadFile(
  pathname: string,
  body: File | Blob | Buffer | ReadableStream,
  options?: {
    contentType?: string
    addRandomSuffix?: boolean
    cacheControlMaxAge?: number
  }
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set")
  }

  try {
    const blob = await put(pathname, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ...options,
    })

    return blob
  } catch (error) {
    console.error("Failed to upload file to Vercel Blob:", error)
    throw error
  }
}

/**
 * Delete a file from Vercel Blob storage
 *
 * @param url - The blob URL to delete
 * @throws Error if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function deleteFile(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set")
  }

  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  } catch (error) {
    console.error("Failed to delete file from Vercel Blob:", error)
    throw error
  }
}

/**
 * List files in Vercel Blob storage with optional prefix filter
 *
 * @param prefix - Optional prefix to filter files
 * @returns Promise with array of blob metadata
 * @throws Error if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function listFiles(prefix?: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set")
  }

  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ...(prefix && { prefix }),
    })

    return blobs
  } catch (error) {
    console.error("Failed to list files from Vercel Blob:", error)
    throw error
  }
}

/**
 * Get metadata for a specific file
 *
 * @param url - The blob URL
 * @returns Promise with blob metadata
 * @throws Error if BLOB_READ_WRITE_TOKEN is not configured
 */
export async function getFileMetadata(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN environment variable is not set")
  }

  try {
    const metadata = await head(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return metadata
  } catch (error) {
    console.error("Failed to get file metadata from Vercel Blob:", error)
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
