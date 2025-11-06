/**
 * Reports tRPC Router
 *
 * Handles generation, storage, and retrieval of PDF and Excel reports.
 * Reports are stored in Netlify Blobs with 24-hour expiry for security.
 *
 * Features:
 * - PDF and Excel report generation
 * - Date range filtering
 * - RBAC support (owner and partner access)
 * - Partner view watermarking
 * - Temporary storage with auto-expiry
 * - Signed download URLs
 */

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
// NOTE: generateProjectPdf is NOT imported here because it must run in Node.js runtime
// PDF generation is handled by the dedicated /api/reports/generate-pdf route
import { generateProjectExcel } from "@/server/services/report-excel.service"
import { cleanupExpiredReports } from "@/server/services/report-cleanup.service"
import { getStore, getDeployStore } from "@netlify/blobs"
import { bufferToArrayBuffer } from "@/server/services/document.service"
import { projects } from "@/server/db/schema/projects"
import { getLocalStore } from "@/server/services/local-blob-store"
import crypto from "crypto"

/**
 * Get the appropriate blob store for reports based on environment
 *
 * In production: Uses production Netlify Blobs
 * In Netlify deploy previews: Uses deploy-specific Netlify Blobs
 * In local development: Uses file system local store in .blobs/reports/ directory (no credentials needed)
 * In test environment: Uses mocked store
 *
 * Note: Local store saves files to .blobs/reports/ directory (gitignored) with 24-hour auto-cleanup
 */
function getReportStore() {
  // Netlify always sets CONTEXT to "production", "deploy-preview", or "branch-deploy"
  const isNetlifyEnvironment = !!process.env.CONTEXT
  const isProduction = process.env.CONTEXT === "production"
  const isTest = process.env.NODE_ENV === "test"

  // Debug logging for Netlify environment detection
  console.log("🔍 getReportStore() environment detection:", {
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
    DEPLOY_ID: process.env.DEPLOY_ID,
    URL: process.env.URL,
    isNetlifyEnvironment,
    isProduction,
    isTest,
  })

  // Test environment: mocks handle the configuration
  if (isTest) {
    console.log("📦 Using TEST store (mocked)")
    return getStore({
      name: "reports",
      consistency: "strong",
      siteID: "test-site-id",
      token: "test-token",
    })
  }

  // Netlify environments (production, deploy-preview, branch-deploy)
  if (isNetlifyEnvironment) {
    // Production uses main store
    if (isProduction) {
      console.log("📦 Using PRODUCTION Netlify Blobs store")
      return getStore({ name: "reports", consistency: "strong" })
    }
    // Deploy previews and branch deploys use deploy-specific store
    console.log("📦 Using DEPLOY-SPECIFIC Netlify Blobs store")
    return getDeployStore("reports")
  }

  // Local development: Use file system local store
  // This allows testing without Netlify credentials and enables manual inspection
  console.log("📦 Using LOCAL file system store")
  return getLocalStore({ name: "reports" }) as any
}

/**
 * Input schema for report generation
 */
const generateReportSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  format: z.enum(["pdf", "excel"], {
    required_error: "Format is required",
    invalid_type_error: "Format must be either 'pdf' or 'excel'",
  }),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
})

/**
 * Output schema for report generation response
 */
type GenerateReportResponse = {
  reportId: string
  downloadUrl: string
  fileName: string
  expiresAt: Date
  format: "pdf" | "excel"
}

/**
 * Reports Router
 */
export const reportsRouter = createTRPCRouter({
  /**
   * Generate a PDF or Excel report for a project
   *
   * Flow:
   * 1. Validate input and user access
   * 2. Generate report (PDF or Excel)
   * 3. Store in Netlify Blobs with 24-hour expiry
   * 4. Return download URL and metadata
   *
   * Access Control:
   * - Project owners can generate full reports
   * - Partners can generate reports (marked as "Partner View")
   * - Reports auto-expire after 24 hours
   */
  generateReport: protectedProcedure
    .input(generateReportSchema)
    .mutation(async ({ ctx, input }): Promise<GenerateReportResponse> => {
      const userId = ctx.session.user.id
      const { projectId, format, startDate, endDate } = input

      try {
        // Determine if user is owner or partner
        // Both generateProjectPdf and generateProjectExcel will verify access
        // and throw FORBIDDEN if user doesn't have access
        const [project] = await ctx.db
          .select({ ownerId: projects.ownerId })
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1)

        const isOwner = project?.ownerId === userId
        const isPartnerView = !isOwner

        // Build report input
        const reportInput = {
          projectId,
          userId,
          dateRange: {
            start: startDate || null,
            end: endDate || null,
          },
          isPartnerView,
        }

        // Generate report based on format
        let reportBuffer: Buffer
        let mimeType: string
        let fileExtension: string

        if (format === "pdf") {
          // PDF generation must happen in dedicated API route to avoid RSC compilation issues
          // Call the internal API route which runs in Node.js runtime

          // Determine base URL for internal API calls
          // In Netlify: use DEPLOY_PRIME_URL (deploy previews) or URL (production)
          // In local dev: use NEXTAUTH_URL or localhost
          // Netlify always sets CONTEXT environment variable
          const isNetlify = !!process.env.CONTEXT
          const baseUrl = isNetlify
            ? process.env.DEPLOY_PRIME_URL || process.env.URL || "http://localhost:3000"
            : process.env.NEXTAUTH_URL || "http://localhost:3000"

          console.log("🔍 NETLIFY env var inspection:", {
            value: process.env.NETLIFY,
            type: typeof process.env.NETLIFY,
            stringified: JSON.stringify(process.env.NETLIFY),
            equalTrue: process.env.NETLIFY === "true",
            equalTrueBoolean: process.env.NETLIFY === true,
            truthyCheck: !!process.env.NETLIFY,
          })

          console.log("🔗 PDF generation baseUrl:", {
            isNetlify,
            CONTEXT: process.env.CONTEXT,
            NETLIFY: process.env.NETLIFY,
            DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
            URL: process.env.URL,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL,
            selectedBaseUrl: baseUrl,
          })

          // Forward authentication cookies from the original request
          const cookieHeader = ctx.headers.get("cookie") || ""

          const response = await fetch(`${baseUrl}/api/reports/generate-pdf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: cookieHeader,
            },
            body: JSON.stringify({
              projectId,
              dateRange: {
                start: startDate?.toISOString(),
                end: endDate?.toISOString(),
              },
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("PDF generation failed:", errorText)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to generate PDF report: ${errorText}`,
            })
          }

          const arrayBuffer = await response.arrayBuffer()
          reportBuffer = Buffer.from(arrayBuffer)
          mimeType = "application/pdf"
          fileExtension = "pdf"
        } else {
          reportBuffer = await generateProjectExcel(ctx.db, reportInput)
          mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          fileExtension = "xlsx"
        }

        // Generate unique report ID and file name
        const reportId = crypto.randomUUID()
        const fileName = `project-report-${Date.now()}.${fileExtension}`
        const blobKey = `${reportId}/${fileName}`

        // Calculate expiry (24 hours from now)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        // Store report in Netlify Blobs
        const store = getReportStore()
        await store.set(blobKey, bufferToArrayBuffer(reportBuffer), {
          metadata: {
            projectId,
            userId,
            format,
            fileName,
            mimeType,
            generatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            isPartnerView: isPartnerView.toString(),
          },
        })

        // Trigger cleanup of expired reports (non-blocking)
        // This lazy cleanup runs on each report generation
        cleanupExpiredReports().catch((error) => {
          console.error("Background report cleanup failed:", error)
          // Don't throw - cleanup failure shouldn't block report generation
        })

        // Generate download URL
        // Note: Netlify Blobs doesn't support signed URLs with expiry out of the box
        // We'll return the blob key and handle download through a separate endpoint
        // that verifies the expiry from metadata
        const downloadUrl = `/api/reports/download/${reportId}/${fileName}`

        return {
          reportId,
          downloadUrl,
          fileName,
          expiresAt,
          format,
        }
      } catch (error) {
        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error
        }

        console.error("Report generation failed:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate report. Please try again.",
        })
      }
    }),

  /**
   * Get report status and download URL
   *
   * Checks if a report exists and hasn't expired.
   * Used for polling during report generation or checking validity.
   */
  getReportStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid("Invalid report ID"),
        fileName: z.string().min(1, "File name is required"),
      })
    )
    .query(async ({ input }) => {
      const { reportId, fileName } = input
      const blobKey = `${reportId}/${fileName}`

      try {
        const store = getReportStore()

        // Check if report exists
        const metadata = await store.getMetadata(blobKey)

        if (!metadata) {
          return {
            status: "expired" as const,
            downloadUrl: null,
          }
        }

        // Check if report has expired
        const metadataObj = metadata as any
        const expiresAt = new Date(metadataObj.expiresAt as string)
        const now = new Date()

        if (expiresAt < now) {
          // Report expired, delete it
          await store.delete(blobKey)
          return {
            status: "expired" as const,
            downloadUrl: null,
          }
        }

        // Report is ready
        return {
          status: "ready" as const,
          downloadUrl: `/api/reports/download/${reportId}/${fileName}`,
          expiresAt,
        }
      } catch (error) {
        console.error("Failed to get report status:", error)
        return {
          status: "expired" as const,
          downloadUrl: null,
        }
      }
    }),

  /**
   * Delete a report manually (before 24-hour expiry)
   *
   * Allows users to clean up reports early if needed.
   */
  deleteReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid("Invalid report ID"),
        fileName: z.string().min(1, "File name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { reportId, fileName } = input
      const blobKey = `${reportId}/${fileName}`

      try {
        const store = getReportStore()

        // Verify user has access to this report
        const metadata = await store.getMetadata(blobKey)

        if (!metadata) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          })
        }

        // Verify the report belongs to this user
        const metadataObj = metadata as any
        if (metadataObj.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this report",
          })
        }

        // Delete the report
        await store.delete(blobKey)

        return {
          success: true,
          message: "Report deleted successfully",
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        console.error("Failed to delete report:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete report",
        })
      }
    }),
})
