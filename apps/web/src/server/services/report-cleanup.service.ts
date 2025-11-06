/**
 * Report Cleanup Service
 *
 * Handles automatic cleanup of expired reports from Netlify Blobs storage.
 * Reports are set to expire after 24 hours for security and storage optimization.
 *
 * Strategy: Lazy Cleanup
 * - Runs automatically on each report generation
 * - Scans all reports and deletes those past expiry
 * - Logs cleanup actions for monitoring
 * - Non-blocking (doesn't affect report generation performance)
 */

import { getBlobStore } from "./blob-store.service"

/**
 * Cleanup result statistics
 */
export interface CleanupResult {
  totalScanned: number
  totalDeleted: number
  deletedReports: string[]
  errors: string[]
}

/**
 * Clean up expired reports from Netlify Blobs storage
 *
 * Scans all reports in the blob store and deletes those that have
 * passed their expiry time (24 hours from generation).
 *
 * This function is designed to be called:
 * - Automatically on each report generation (lazy cleanup)
 * - Manually via admin/maintenance scripts
 * - Via scheduled job (future enhancement)
 *
 * @returns Cleanup statistics
 */
export async function cleanupExpiredReports(): Promise<CleanupResult> {
  const result: CleanupResult = {
    totalScanned: 0,
    totalDeleted: 0,
    deletedReports: [],
    errors: [],
  }

  try {
    const store = getBlobStore("reports")
    const now = new Date()

    // List all reports in the blob store
    const { blobs } = await store.list()

    result.totalScanned = blobs.length

    // Check each report's expiry and delete if expired
    for (const blob of blobs) {
      try {
        // Get metadata to check expiry
        const metadata = await store.getMetadata(blob.key)

        if (!metadata) {
          // No metadata - skip (shouldn't happen)
          console.warn(`Report ${blob.key} has no metadata`)
          continue
        }

        // Netlify Blobs returns metadata nested under a 'metadata' property
        const metadataWrapper = metadata as any // eslint-disable-line @typescript-eslint/no-explicit-any
        const reportMetadata = metadataWrapper.metadata

        if (!reportMetadata || !reportMetadata.expiresAt) {
          // No expiry info - skip (shouldn't happen)
          console.warn(`Report ${blob.key} has no expiry metadata`)
          continue
        }

        const expiresAt = new Date(reportMetadata.expiresAt as string)

        // Delete if expired
        if (expiresAt < now) {
          await store.delete(blob.key)
          result.totalDeleted++
          result.deletedReports.push(blob.key)

          console.log(`Deleted expired report: ${blob.key} (expired at ${expiresAt.toISOString()})`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        result.errors.push(`Failed to process ${blob.key}: ${errorMessage}`)
        console.error(`Failed to process report ${blob.key}:`, error)
        // Continue with next report
      }
    }

    // Log cleanup summary
    if (result.totalDeleted > 0) {
      console.log(
        `Report cleanup completed: ${result.totalDeleted} of ${result.totalScanned} reports deleted`
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    result.errors.push(`Cleanup failed: ${errorMessage}`)
    console.error("Report cleanup failed:", error)
  }

  return result
}

/**
 * Check if a specific report has expired
 *
 * Utility function to check if a single report should be deleted.
 * Used by the reports router to verify report validity.
 *
 * @param reportId - Report ID (UUID)
 * @param fileName - File name
 * @returns True if report is expired or not found
 */
export async function isReportExpired(reportId: string, fileName: string): Promise<boolean> {
  try {
    const store = getBlobStore("reports")
    const blobKey = `${reportId}/${fileName}`

    const metadata = await store.getMetadata(blobKey)

    if (!metadata) {
      // No metadata - consider expired
      return true
    }

    // Netlify Blobs returns metadata nested under a 'metadata' property
    const metadataWrapper = metadata as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const reportMetadata = metadataWrapper.metadata

    if (!reportMetadata || !reportMetadata.expiresAt) {
      // No expiry - consider expired
      return true
    }

    const expiresAt = new Date(reportMetadata.expiresAt as string)
    const now = new Date()

    return expiresAt < now
  } catch (error) {
    console.error("Failed to check report expiry:", error)
    // On error, consider expired for safety
    return true
  }
}

/**
 * Delete a specific report by ID and file name
 *
 * Used for manual cleanup or when a report is accessed after expiry.
 *
 * @param reportId - Report ID (UUID)
 * @param fileName - File name
 * @returns True if deleted successfully, false if not found
 */
export async function deleteReport(reportId: string, fileName: string): Promise<boolean> {
  try {
    const store = getBlobStore("reports")
    const blobKey = `${reportId}/${fileName}`

    await store.delete(blobKey)
    console.log(`Manually deleted report: ${blobKey}`)
    return true
  } catch (error) {
    console.error(`Failed to delete report ${reportId}/${fileName}:`, error)
    return false
  }
}

/**
 * Get report metadata including expiry information
 *
 * Utility function to retrieve report metadata for status checks.
 *
 * @param reportId - Report ID (UUID)
 * @param fileName - File name
 * @returns Metadata object or null if not found
 */
export async function getReportMetadata(
  reportId: string,
  fileName: string
): Promise<Record<string, unknown> | null> {
  try {
    const store = getBlobStore("reports")
    const blobKey = `${reportId}/${fileName}`

    const metadata = await store.getMetadata(blobKey)
    return metadata || null
  } catch (error) {
    console.error(`Failed to get metadata for report ${reportId}/${fileName}:`, error)
    return null
  }
}
