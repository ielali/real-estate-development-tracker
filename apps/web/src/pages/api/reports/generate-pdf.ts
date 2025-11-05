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
  // Use multiple logging methods to ensure we see SOMETHING
  console.log("📥 PDF Generation API called")
  console.error("📥 [STDERR] PDF Generation API called")
  process.stdout.write("📥 [STDOUT] PDF Generation API called\n")
  process.stderr.write("📥 [STDERR DIRECT] PDF Generation API called\n")

  console.log("   Method:", req.method)
  console.log("   Headers:", JSON.stringify(req.headers, null, 2))
  console.log("   ENV NODE_ENV:", process.env.NODE_ENV)
  console.log("   ENV DEPLOY_PRIME_URL:", process.env.DEPLOY_PRIME_URL)
  console.log("   ENV URL:", process.env.URL)
  console.log("   ENV CONTEXT:", process.env.CONTEXT)
  console.log("   Timestamp:", new Date().toISOString())

  // Only allow POST requests
  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method)
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    console.log("🔐 Verifying authentication...")
    // Verify authentication using Better Auth
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    })

    console.log("   Session exists:", !!session)
    console.log("   User ID:", session?.user?.id)

    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session or user ID")
      return res.status(401).json({
        error: "Unauthorized - Please sign in to generate reports",
      })
    }

    // Parse request body
    console.log("📦 Parsing request body:", JSON.stringify(req.body, null, 2))
    const { projectId, dateRange } = req.body

    if (!projectId) {
      console.log("❌ Project ID missing in request")
      return res.status(400).json({ error: "Project ID is required" })
    }

    console.log("   Project ID:", projectId)
    console.log("   Date Range:", dateRange)

    // Verify user has access to the project (owner or partner)
    console.log("🔍 Querying project from database...")
    const [project] = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
      .limit(1)

    console.log("   Project found:", !!project)
    console.log("   Project owner ID:", project?.ownerId)

    if (!project) {
      console.log("❌ Project not found")
      return res.status(404).json({ error: "Project not found" })
    }

    const isOwner = project.ownerId === session.user.id
    console.log("   Is Owner:", isOwner)

    // Check if user is accepted partner
    console.log("🔍 Checking partner access...")
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
    console.log("   Is Partner:", isPartner)

    if (!isOwner && !isPartner) {
      console.log("❌ Access denied - user is neither owner nor partner")
      return res.status(403).json({
        error: "You do not have access to this project",
      })
    }

    // Parse date range
    const startDate = dateRange?.start ? new Date(dateRange.start) : null
    const endDate = dateRange?.end ? new Date(dateRange.end) : null

    // Generate PDF
    console.log(
      `🎨 Generating PDF for project ${projectId} (${isPartner ? "partner" : "owner"} view)`
    )

    const pdfBuffer = await generateProjectPdf(db, {
      projectId,
      userId: session.user.id,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      isPartnerView: isPartner,
    })

    console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`)

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
