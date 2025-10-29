import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { documents } from "@/server/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { documentService } from "@/server/services/document.service"
import { verifyProjectAccess } from "@/server/api/helpers/authorization"

/**
 * GET /api/documents/[id]/thumbnail
 *
 * Serves document thumbnail with authorization check.
 * Verifies user has read access to the document's project before serving.
 *
 * @param request - Next.js request
 * @param params - Route params with document ID
 * @returns Thumbnail image or error response
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: documentId } = await params

    // Fetch document with project info
    const document = await db.query.documents.findFirst({
      where: and(eq(documents.id, documentId), isNull(documents.deletedAt)),
      columns: {
        id: true,
        thumbnailUrl: true,
        projectId: true,
        mimeType: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Verify project access (read permission required)
    try {
      await verifyProjectAccess(
        { headers: request.headers, db, session, user: session.user },
        document.projectId,
        "read"
      )
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // If thumbnailUrl is a placeholder path, redirect to it
    if (document.thumbnailUrl?.startsWith("/icons/")) {
      return NextResponse.redirect(new URL(document.thumbnailUrl, request.url))
    }

    // Fetch thumbnail blob from storage
    if (!document.thumbnailUrl) {
      return NextResponse.json({ error: "Thumbnail not available" }, { status: 404 })
    }

    const thumbnailData = await documentService.get(document.thumbnailUrl)

    if (!thumbnailData) {
      return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 })
    }

    // Convert base64 data to buffer
    const buffer = Buffer.from(thumbnailData, "base64")

    // Return image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Thumbnail serving error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
