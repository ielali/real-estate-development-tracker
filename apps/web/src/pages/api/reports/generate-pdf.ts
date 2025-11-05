/**
 * Pages Router API Route for PDF Generation
 *
 * This route uses the Pages Router instead of App Router to completely
 * bypass React Server Components compilation, which breaks @react-pdf/renderer.
 *
 * Pages Router API routes run in pure Node.js without any RSC transforms.
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import { projects } from "@/server/db/schema/projects"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { generateProjectPdf } from "@/server/services/report-pdf.service"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Verify authentication using Better Auth
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    })

    if (!session?.user?.id) {
      return res.status(401).json({
        error: "Unauthorized - Please sign in to generate reports",
      })
    }

    // Parse request body
    const { projectId, dateRange } = req.body

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" })
    }

    // Verify user has access to the project (owner or partner)
    const [project] = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1)

    if (!project) {
      return res.status(404).json({ error: "Project not found" })
    }

    const isOwner = project.ownerId === session.user.id

    // Check if user is accepted partner
    const [access] = await db
      .select({ id: projectAccess.id })
      .from(projectAccess)
      .where(
        and(
          eq(projectAccess.projectId, projectId),
          eq(projectAccess.userId, session.user.id),
          isNotNull(projectAccess.acceptedAt),
          isNull(projectAccess.deletedAt)
        )
      )
      .limit(1)

    const isPartner = !!access

    if (!isOwner && !isPartner) {
      return res.status(403).json({
        error: "You do not have access to this project",
      })
    }

    // Parse date range
    const startDate = dateRange?.start ? new Date(dateRange.start) : null
    const endDate = dateRange?.end ? new Date(dateRange.end) : null

    // Generate PDF
    const pdfBuffer = await generateProjectPdf(db, {
      projectId,
      userId: session.user.id,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      isPartnerView: isPartner,
    })

    // Set response headers for PDF
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Length", pdfBuffer.length.toString())
    res.setHeader("Cache-Control", "no-store, max-age=0")

    // Send PDF buffer
    return res.status(200).send(pdfBuffer)
  } catch (error) {
    console.error("❌ PDF generation API error:", error)
    return res.status(500).json({
      error: "Failed to generate PDF",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
