/**
 * Report Download API Endpoint
 *
 * Serves generated PDF and Excel reports from Netlify Blobs storage.
 * Implements authentication, expiry verification, and secure blob delivery.
 *
 * Security Features:
 * - Session authentication required
 * - User access verification via metadata
 * - Automatic expiry check (24-hour TTL)
 * - Expired reports auto-deleted
 *
 * @route GET /api/reports/download/[reportId]/[fileName]
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { getBlobStore } from "@/server/services/blob-store.service"

export const runtime = "nodejs" // Use Node.js runtime for blob access
export const dynamic = "force-dynamic" // Don't cache responses

/**
 * Report metadata interface
 */
interface ReportMetadata {
  projectId: string
  userId: string
  format: string
  fileName: string
  mimeType: string
  generatedAt: string
  expiresAt: string
  isPartnerView: string
}

/**
 * Download a generated report
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing reportId and fileName
 * @returns Report file stream or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string; fileName: string }> }
) {
  try {
    // 1. Authenticate user using Better Auth
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to download reports" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { reportId, fileName } = await params

    // 2. Validate parameters
    if (!reportId || !fileName) {
      return NextResponse.json(
        { error: "Invalid request - Missing reportId or fileName" },
        { status: 400 }
      )
    }

    // 3. Get blob store and retrieve metadata
    const store = getBlobStore("reports")
    const blobKey = `${reportId}/${fileName}`

    const metadata = await store.getMetadata(blobKey)

    if (!metadata) {
      return NextResponse.json({ error: "Report not found - It may have expired" }, { status: 404 })
    }

    // 4. Parse and validate metadata
    // Netlify Blobs returns metadata nested under a 'metadata' property
    // Structure: { etag: "...", metadata: { ...our data } }
    const metadataWrapper = metadata as { metadata: ReportMetadata }
    const reportMetadata = metadataWrapper.metadata

    if (!reportMetadata.expiresAt || !reportMetadata.userId) {
      return NextResponse.json({ error: "Invalid report metadata" }, { status: 500 })
    }

    // 5. Check expiry
    const expiresAt = new Date(reportMetadata.expiresAt)
    const now = new Date()

    if (expiresAt < now) {
      // Report expired - delete it and return 404
      await store.delete(blobKey)
      return NextResponse.json(
        { error: "Report has expired - Please generate a new report" },
        { status: 404 }
      )
    }

    // 6. Verify user access
    if (reportMetadata.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - You do not have access to this report" },
        { status: 403 }
      )
    }

    // 7. Retrieve blob data
    const blob = await store.get(blobKey)

    if (!blob) {
      return NextResponse.json({ error: "Report data not found" }, { status: 404 })
    }

    // 8. Determine MIME type
    const mimeType =
      reportMetadata.mimeType ||
      (fileName.endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    // 9. Return blob as downloadable file
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Expires: "0",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Report download failed:", error)
    return NextResponse.json(
      { error: "Failed to download report - Please try again later" },
      { status: 500 }
    )
  }
}
