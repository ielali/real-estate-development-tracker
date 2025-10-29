import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { documents } from "@/server/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { documentService } from "@/server/services/document.service"
import { verifyProjectAccess } from "@/server/api/helpers/authorization"

/**
 * GET /api/documents/[id]/view
 *
 * Serves document for viewing with authorization check.
 * Verifies user has read access to the document's project before serving.
 *
 * @param request - Next.js request
 * @param params - Route params with document ID
 * @returns Document file or error response
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
        blobUrl: true,
        projectId: true,
        mimeType: true,
        fileName: true,
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

    // Fetch document blob from storage
    const blobData = await documentService.get(document.blobUrl)

    if (!blobData) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Convert base64 data to buffer
    const buffer = Buffer.from(blobData, "base64")

    // Determine Content-Disposition header based on file type
    // Images can be displayed inline, others should download
    const disposition = document.mimeType.startsWith("image/") ? "inline" : "attachment"

    // Return document with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(document.fileName)}"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Document serving error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
