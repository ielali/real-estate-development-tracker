/**
 * PDF Report Generation Service
 *
 * Generates professional PDF reports for real estate development projects
 * using @react-pdf/renderer. Includes executive summary, cost breakdowns,
 * vendor summaries, timeline visualizations, and document inventories.
 *
 * Features:
 * - Investor-grade formatting with company branding
 * - RBAC support (owner vs partner views)
 * - Partner view watermarking
 * - Date range filtering
 * - Chart visualizations
 * - Professional styling
 *
 * IMPORTANT: This service must be called from a Node.js runtime API route.
 * The @react-pdf/renderer package uses React reconciler which is incompatible
 * with React Server Components. Use the /api/reports/generate-pdf route.
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  Circle,
  Rect,
  G,
  Line,
} from "@react-pdf/renderer"
import { TRPCError } from "@trpc/server"
import { eq, and, isNull, gte, lte, isNotNull, desc, asc, sql } from "drizzle-orm"
import type { Database } from "@/server/db"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { categories } from "@/server/db/schema/categories"
import { documents } from "@/server/db/schema/documents"
import { events } from "@/server/db/schema/events"
import { users } from "@/server/db/schema/users"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { addresses } from "@/server/db/schema/addresses"
import {
  pdfStyles,
  PDF_WATERMARK,
  formatFileSize,
  getConfidentialityNotice,
} from "@/lib/utils/pdf-config"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"

/**
 * Load logo as base64 data URI for React-PDF
 * React-PDF cannot use relative web paths on server side, so we fetch the logo
 * from the deployed URL and convert to data URI
 *
 * Uses pre-converted logo-pdf.jpg which is optimized for @react-pdf/renderer
 * Uses NEXT_PUBLIC_SITE_URL which is injected at build time from DEPLOY_PRIME_URL
 * This ensures the logo is fetched from the correct deployment URL
 */
async function getLogoDataUri(): Promise<string | null> {
  try {
    // Use build-time injected site URL (works in all environments)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    // Use pre-converted JPEG logo for reliable PDF compatibility
    const logoUrl = `${baseUrl}/logo-pdf.jpg`

    console.log(`Fetching logo from: ${logoUrl}`)

    const response = await fetch(logoUrl)

    if (!response.ok) {
      console.warn(`Logo not found at ${logoUrl}: ${response.status}`)
      return null
    }

    // Get the content as a buffer for proper base64 encoding
    const logoBuffer = Buffer.from(await response.arrayBuffer())

    // Verify we got valid data
    if (logoBuffer.length === 0) {
      console.warn("Logo buffer is empty")
      return null
    }

    console.log(`Logo loaded: ${logoBuffer.length} bytes`)

    // Encode as base64 with JPEG MIME type
    const logoBase64 = logoBuffer.toString("base64")
    const dataUri = `data:image/jpeg;base64,${logoBase64}`

    console.log(`Logo data URI created: ${dataUri.length} characters`)

    return dataUri
  } catch (error) {
    console.error("Failed to load logo:", error)
    return null // Return null if logo can't be loaded
  }
}

/**
 * Input parameters for PDF report generation
 */
export interface PdfReportInput {
  projectId: string
  userId: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  isPartnerView: boolean
}

/**
 * Aggregated report data structure
 */
interface ReportData {
  // Project info
  project: {
    name: string
    description: string | null
    status: string
    projectType: string
    startDate: Date | null
    endDate: Date | null
    totalBudget: number | null
    address: string
  }

  // Executive summary metrics
  summary: {
    totalCost: number
    costCount: number
    vendorCount: number
    documentCount: number
    timelineEventCount: number
  }

  // Cost breakdown by category
  costsByCategory: Array<{
    categoryId: string
    categoryName: string
    total: number
    count: number
    percentage: number
  }>

  // Top vendors by spend
  topVendors: Array<{
    vendorId: string | null
    vendorName: string
    company: string | null
    totalSpent: number
    costCount: number
  }>

  // Timeline events
  timeline: Array<{
    id: string
    title: string
    date: Date
    categoryName: string
    category: string // Added for TimelineChart component compatibility
    description: string | null
  }>

  // Documents
  documents: Array<{
    fileName: string
    fileSize: number
    categoryName: string
    uploadedAt: Date
    uploadedBy: string
  }>

  // Metadata
  generatedAt: Date
  generatedBy: string
  isPartnerView: boolean
  logoDataUri: string | null
}

/**
 * Verify user has access to project (owner or accepted partner)
 *
 * @param db - Database instance
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns Object with isOwner and isPartner flags
 * @throws {TRPCError} FORBIDDEN - User doesn't have access
 */
async function verifyAccessAndGetRole(
  db: Database,
  projectId: string,
  userId: string
): Promise<{ isOwner: boolean; isPartner: boolean }> {
  // Check if user is project owner
  const [project] = await db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    })
  }

  const isOwner = project.ownerId === userId

  // Check if user is accepted partner
  const [access] = await db
    .select({ id: projectAccess.id })
    .from(projectAccess)
    .where(
      and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, userId),
        isNotNull(projectAccess.acceptedAt),
        isNull(projectAccess.deletedAt)
      )
    )
    .limit(1)

  const isPartner = !!access

  if (!isOwner && !isPartner) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this project",
    })
  }

  return { isOwner, isPartner }
}

/**
 * Fetch and aggregate all report data
 *
 * @param db - Database instance
 * @param input - Report generation input
 * @returns Aggregated report data
 */
async function fetchReportData(db: Database, input: PdfReportInput): Promise<ReportData> {
  const { projectId, userId, dateRange } = input

  // Fetch logo early in the process
  const logoDataUri = await getLogoDataUri()

  // Build date range filters
  const dateFilters = []
  if (dateRange.start) {
    dateFilters.push(gte(costs.date, dateRange.start))
  }
  if (dateRange.end) {
    dateFilters.push(lte(costs.date, dateRange.end))
  }

  // Fetch project details
  const [projectRecord] = await db
    .select({
      name: projects.name,
      description: projects.description,
      status: projects.status,
      projectType: projects.projectType,
      startDate: projects.startDate,
      endDate: projects.endDate,
      totalBudget: projects.totalBudget,
      addressId: projects.addressId,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1)

  if (!projectRecord) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    })
  }

  // Fetch address if project has one
  let addressString = "Address not specified"
  if (projectRecord.addressId) {
    const [addressRecord] = await db
      .select({
        formattedAddress: addresses.formattedAddress,
        streetNumber: addresses.streetNumber,
        streetName: addresses.streetName,
        streetType: addresses.streetType,
        suburb: addresses.suburb,
        state: addresses.state,
        postcode: addresses.postcode,
      })
      .from(addresses)
      .where(eq(addresses.id, projectRecord.addressId))
      .limit(1)

    if (addressRecord) {
      // Use formatted address if available, otherwise build from components
      if (addressRecord.formattedAddress) {
        addressString = addressRecord.formattedAddress
      } else {
        // Build address from components
        const parts = []
        const streetPart = [
          addressRecord.streetNumber,
          addressRecord.streetName,
          addressRecord.streetType,
        ]
          .filter(Boolean)
          .join(" ")
        if (streetPart) parts.push(streetPart)
        if (addressRecord.suburb) parts.push(addressRecord.suburb)
        if (addressRecord.state) parts.push(addressRecord.state)
        if (addressRecord.postcode) parts.push(addressRecord.postcode)

        addressString = parts.length > 0 ? parts.join(", ") : "Address not specified"
      }
    }
  }

  const projectData = {
    ...projectRecord,
    address: addressString,
  }

  // Fetch costs with date filtering
  const costsData = await db
    .select({
      id: costs.id,
      amount: costs.amount,
      categoryId: costs.categoryId,
      contactId: costs.contactId,
      date: costs.date,
    })
    .from(costs)
    .where(and(eq(costs.projectId, projectId), isNull(costs.deletedAt), ...dateFilters))

  // Calculate summary metrics
  // Note: cost.amount should be number (schema has mode: "number"), but ensure it's converted
  const totalCost = costsData.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0)
  const uniqueVendors = new Set(
    costsData.filter((c: any) => c.contactId).map((c: any) => c.contactId)
  )

  // Fetch cost breakdown by category
  const costsByCategoryData = await db
    .select({
      categoryId: costs.categoryId,
      categoryName: categories.displayName,
      total: sql<number>`CAST(SUM(${costs.amount}) AS BIGINT)`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(costs)
    .innerJoin(categories, eq(costs.categoryId, categories.id))
    .where(and(eq(costs.projectId, projectId), isNull(costs.deletedAt), ...dateFilters))
    .groupBy(costs.categoryId, categories.displayName)
    .orderBy(desc(sql`SUM(${costs.amount})`))

  // Calculate percentages for cost breakdown
  // Note: PostgreSQL BIGINT is returned as string to avoid precision loss
  // Convert to number for calculations
  const costsByCategory = costsByCategoryData.map((item: any) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    total: typeof item.total === "string" ? parseInt(item.total, 10) : item.total,
    count: typeof item.count === "string" ? parseInt(item.count, 10) : item.count,
    percentage: totalCost > 0 ? (Number(item.total) / totalCost) * 100 : 0,
  }))

  // Fetch top 10 vendors by spend
  const topVendorsData = await db
    .select({
      vendorId: costs.contactId,
      vendorName: sql<string>`COALESCE(${contacts.firstName} || ' ' || ${contacts.lastName}, 'Unknown Vendor')`,
      company: contacts.company,
      totalSpent: sql<number>`CAST(SUM(${costs.amount}) AS BIGINT)`,
      costCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(costs)
    .leftJoin(contacts, eq(costs.contactId, contacts.id))
    .where(
      and(
        eq(costs.projectId, projectId),
        isNotNull(costs.contactId),
        isNull(costs.deletedAt),
        ...dateFilters
      )
    )
    .groupBy(costs.contactId, contacts.firstName, contacts.lastName, contacts.company)
    .orderBy(desc(sql`SUM(${costs.amount})`))
    .limit(10)

  // Fetch timeline events
  const eventFilters = []
  if (dateRange.start) {
    eventFilters.push(gte(events.date, dateRange.start))
  }
  if (dateRange.end) {
    eventFilters.push(lte(events.date, dateRange.end))
  }

  const timelineData = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      categoryName: categories.displayName,
      description: events.description,
    })
    .from(events)
    .innerJoin(categories, eq(events.categoryId, categories.id))
    .where(and(eq(events.projectId, projectId), isNull(events.deletedAt), ...eventFilters))
    .orderBy(asc(events.date))

  // Fetch documents
  const documentsData = await db
    .select({
      fileName: documents.fileName,
      fileSize: documents.fileSize,
      categoryName: categories.displayName,
      uploadedAt: documents.createdAt,
      uploadedBy: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`,
    })
    .from(documents)
    .innerJoin(categories, eq(documents.categoryId, categories.id))
    .leftJoin(users, eq(documents.uploadedById, users.id))
    .where(and(eq(documents.projectId, projectId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt))

  // Get current user name for "generated by"
  const [currentUser] = await db
    .select({
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return {
    project: {
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      projectType: projectData.projectType,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      totalBudget: projectData.totalBudget,
      address: projectData.address,
    },
    summary: {
      totalCost,
      costCount: costsData.length,
      vendorCount: uniqueVendors.size,
      documentCount: documentsData.length,
      timelineEventCount: timelineData.length,
    },
    costsByCategory,
    // Convert BIGINT strings to numbers for topVendors
    topVendors: topVendorsData.map((vendor: any) => ({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      company: vendor.company,
      totalSpent:
        typeof vendor.totalSpent === "string" ? parseInt(vendor.totalSpent, 10) : vendor.totalSpent,
      costCount:
        typeof vendor.costCount === "string" ? parseInt(vendor.costCount, 10) : vendor.costCount,
    })),
    // Map timeline data to match TimelineChart expected structure
    timeline: timelineData.map((event: any) => ({
      ...event,
      category: event.categoryName, // TimelineChart expects 'category' not 'categoryName'
    })),
    documents: documentsData,
    generatedAt: new Date(),
    generatedBy: currentUser?.name || "Unknown",
    isPartnerView: input.isPartnerView,
    logoDataUri,
  }
}

/**
 * Pie Chart Component for Category Breakdown
 */
interface PieChartProps {
  data: Array<{
    label: string
    value: number
    percentage: number
  }>
  width?: number
  height?: number
}

const PieChart: React.FC<PieChartProps> = ({ data, width = 300, height = 300 }) => {
  if (data.length === 0) return <View />

  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 20

  // Color palette for chart slices
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ]

  let currentAngle = -90 // Start from top

  const slices = data.map((item, index) => {
    const angle = (item.percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    // Calculate arc path
    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ")

    return {
      path: pathData,
      color: colors[index % colors.length],
      label: String(item.label), // Ensure it's a string
      percentage: Number(item.percentage), // Ensure it's a number
    }
  })

  return (
    <View style={{ marginVertical: 15, alignItems: "center" }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {slices.map((slice, index) => (
          <Path key={index} d={slice.path} fill={slice.color} />
        ))}
      </Svg>

      {/* Legend */}
      <View style={{ marginTop: 10, width: "100%" }}>
        {slices.map((slice, index) => (
          <View
            key={index}
            style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}
          >
            <View style={{ marginRight: 5 }}>
              <Svg width={12} height={12}>
                <Rect width={12} height={12} fill={slice.color} />
              </Svg>
            </View>
            <Text style={{ fontSize: 9 }}>
              {slice.label}: {slice.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * Bar Chart Component for Vendor Spend
 */
interface BarChartProps {
  data: Array<{
    label: string
    value: number
  }>
  width?: number
  height?: number
}

const BarChart: React.FC<BarChartProps> = ({ data, width = 450, height = 250 }) => {
  if (data.length === 0) return <View />

  const chartPadding = { top: 20, right: 30, bottom: 60, left: 80 }
  const chartWidth = width - chartPadding.left - chartPadding.right
  const chartHeight = height - chartPadding.top - chartPadding.bottom

  const maxValue = Math.max(...data.map((d) => d.value), 1) // Ensure at least 1 to avoid division by zero
  const barWidth = chartWidth / Math.max(data.length, 1) - 10
  const barColor = "#3b82f6"

  return (
    <View style={{ marginVertical: 15 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis */}
        <Line
          x1={chartPadding.left}
          y1={chartPadding.top}
          x2={chartPadding.left}
          y2={height - chartPadding.bottom}
          stroke="#000"
          strokeWidth={1}
        />

        {/* X-axis */}
        <Line
          x1={chartPadding.left}
          y1={height - chartPadding.bottom}
          x2={width - chartPadding.right}
          y2={height - chartPadding.bottom}
          stroke="#000"
          strokeWidth={1}
        />

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
          const x = chartPadding.left + index * (barWidth + 10) + 5
          const y = height - chartPadding.bottom - barHeight

          return (
            <G key={index}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={barColor} />
            </G>
          )
        })}
      </Svg>

      {/* Labels below chart */}
      <View style={{ marginTop: 5 }}>
        {data.map((item, index) => (
          <Text key={index} style={{ fontSize: 8, marginVertical: 1 }}>
            {item.label}: {formatCurrency(item.value)}
          </Text>
        ))}
      </View>
    </View>
  )
}

/**
 * Timeline Visualization Component
 */
interface TimelineChartProps {
  data: Array<{
    date: Date
    title: string
    category: string
  }>
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  if (data.length === 0) return <View />

  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
  const categoryColors: Record<string, string> = {
    milestone: "#10b981",
    deadline: "#ef4444",
    meeting: "#3b82f6",
    inspection: "#f59e0b",
    default: "#6b7280",
  }

  // Helper to safely get category color
  const getCategoryColor = (category: string | undefined | null): string => {
    if (!category) return categoryColors.default
    const lowerCategory = category.toLowerCase()
    return categoryColors[lowerCategory] || categoryColors.default
  }

  return (
    <View style={{ marginVertical: 15 }}>
      {sortedData.map((event, index) => (
        <View
          key={index}
          style={{ flexDirection: "row", marginVertical: 8, alignItems: "flex-start" }}
        >
          {/* Date marker */}
          <View style={{ width: 80, marginRight: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>
              {format(event.date, "dd/MM/yyyy")}
            </Text>
          </View>

          {/* Timeline dot and line */}
          <View style={{ alignItems: "center", marginRight: 10 }}>
            <Svg width={16} height={16}>
              <Circle
                cx={8}
                cy={8}
                r={6}
                fill={getCategoryColor(event.category)}
                stroke="#fff"
                strokeWidth={2}
              />
            </Svg>
            {index < sortedData.length - 1 ? (
              <View style={{ width: 2, height: 20, backgroundColor: "#e5e7eb", marginTop: 2 }} />
            ) : null}
          </View>

          {/* Event details */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 2 }}>{event.title}</Text>
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              {event.category
                ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
                : "Uncategorized"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

/**
 * PDF Report Document Component
 */
const ProjectReportPDF: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={pdfStyles.coverPage}>
        {data.logoDataUri ? <Image src={data.logoDataUri} style={pdfStyles.coverLogo} /> : null}
        <Text style={pdfStyles.coverTitle}>{data.project.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>Financial Report</Text>
        <Text style={pdfStyles.coverMeta}>Generated: {format(data.generatedAt, "dd/MM/yyyy")}</Text>
        <Text style={pdfStyles.coverMeta}>By: {data.generatedBy}</Text>
        {data.isPartnerView ? (
          <View style={{ marginTop: 30 }}>
            <Text style={{ ...pdfStyles.coverMeta, color: "#ef4444", fontSize: 12 }}>
              PARTNER VIEW
            </Text>
          </View>
        ) : null}
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={pdfStyles.page}>
        {data.isPartnerView ? (
          <View style={pdfStyles.watermark}>
            <Text>{PDF_WATERMARK.text}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.pageHeader}>Executive Summary</Text>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.metricsContainer}>
            <View style={pdfStyles.metricCard}>
              <Text style={pdfStyles.metricLabel}>Total Project Cost</Text>
              <Text style={pdfStyles.metricValue}>{formatCurrency(data.summary.totalCost)}</Text>
            </View>
            <View style={{ ...pdfStyles.metricCard, marginRight: 0 }}>
              <Text style={pdfStyles.metricLabel}>Cost Entries</Text>
              <Text style={pdfStyles.metricValue}>{data.summary.costCount}</Text>
            </View>
          </View>

          <View style={pdfStyles.metricsContainer}>
            <View style={pdfStyles.metricCard}>
              <Text style={pdfStyles.metricLabel}>Vendors</Text>
              <Text style={pdfStyles.metricValue}>{data.summary.vendorCount}</Text>
            </View>
            <View style={{ ...pdfStyles.metricCard, marginRight: 0 }}>
              <Text style={pdfStyles.metricLabel}>Documents</Text>
              <Text style={pdfStyles.metricValue}>{data.summary.documentCount}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionHeader}>Project Details</Text>
          <View style={{ ...pdfStyles.row, marginTop: 5 }}>
            <Text style={{ flex: 1, fontWeight: "bold" }}>Status:</Text>
            <Text style={{ flex: 2 }}>
              {data.project.status.charAt(0).toUpperCase() + data.project.status.slice(1)}
            </Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={{ flex: 1, fontWeight: "bold" }}>Type:</Text>
            <Text style={{ flex: 2 }}>
              {data.project.projectType.charAt(0).toUpperCase() + data.project.projectType.slice(1)}
            </Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={{ flex: 1, fontWeight: "bold" }}>Address:</Text>
            <Text style={{ flex: 2 }}>{data.project.address}</Text>
          </View>
          {data.project.startDate ? (
            <View style={pdfStyles.row}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Start Date:</Text>
              <Text style={{ flex: 2 }}>{format(data.project.startDate, "dd/MM/yyyy")}</Text>
            </View>
          ) : null}
          {data.project.endDate ? (
            <View style={pdfStyles.row}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>End Date:</Text>
              <Text style={{ flex: 2 }}>{format(data.project.endDate, "dd/MM/yyyy")}</Text>
            </View>
          ) : null}
          {data.project.totalBudget ? (
            <View style={pdfStyles.row}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Total Budget:</Text>
              <Text style={{ flex: 2 }}>{formatCurrency(data.project.totalBudget)}</Text>
            </View>
          ) : null}
        </View>

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>{getConfidentialityNotice(data.isPartnerView)}</Text>
          <Text style={pdfStyles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Cost Breakdown by Category */}
      <Page size="A4" style={pdfStyles.page}>
        {data.isPartnerView ? (
          <View style={pdfStyles.watermark}>
            <Text>{PDF_WATERMARK.text}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.pageHeader}>Cost Breakdown by Category</Text>

        {data.costsByCategory.length > 0 ? (
          <View>
            {/* Pie Chart Visualization */}
            <PieChart
              data={data.costsByCategory.map((item) => ({
                label: item.categoryName,
                value: item.total,
                percentage: item.percentage,
              }))}
            />
          </View>
        ) : null}

        {data.costsByCategory.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Category</Text>
              <Text style={pdfStyles.tableCellRight}>Amount</Text>
              <Text style={pdfStyles.tableCellRight}>Count</Text>
              <Text style={pdfStyles.tableCellRight}>% of Total</Text>
            </View>

            {data.costsByCategory.map((item, index) => (
              <View
                key={item.categoryId}
                style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlternate}
              >
                <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{item.categoryName}</Text>
                <Text style={pdfStyles.tableCellRight}>{formatCurrency(item.total)}</Text>
                <Text style={pdfStyles.tableCellRight}>{item.count}</Text>
                <Text style={pdfStyles.tableCellRight}>{item.percentage.toFixed(1)}%</Text>
              </View>
            ))}

            <View style={{ ...pdfStyles.tableRow, backgroundColor: "#f3f4f6" }}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2, fontWeight: "bold" }}>TOTAL</Text>
              <Text style={{ ...pdfStyles.tableCellRight, fontWeight: "bold" }}>
                {formatCurrency(data.summary.totalCost)}
              </Text>
              <Text style={{ ...pdfStyles.tableCellRight, fontWeight: "bold" }}>
                {data.summary.costCount}
              </Text>
              <Text style={{ ...pdfStyles.tableCellRight, fontWeight: "bold" }}>100.0%</Text>
            </View>
          </View>
        ) : (
          <Text style={pdfStyles.paragraph}>
            No cost data available for the selected date range.
          </Text>
        )}

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>{getConfidentialityNotice(data.isPartnerView)}</Text>
          <Text style={pdfStyles.footerText}>Page 2</Text>
        </View>
      </Page>

      {/* Top Vendors */}
      <Page size="A4" style={pdfStyles.page}>
        {data.isPartnerView ? (
          <View style={pdfStyles.watermark}>
            <Text>{PDF_WATERMARK.text}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.pageHeader}>Top Vendors by Spend</Text>

        {data.topVendors.length > 0 ? (
          <View>
            {/* Bar Chart Visualization */}
            <BarChart
              data={data.topVendors.slice(0, 8).map((vendor) => ({
                label:
                  vendor.vendorName.length > 20
                    ? vendor.vendorName.substring(0, 17) + "..."
                    : vendor.vendorName,
                value: vendor.totalSpent,
              }))}
            />
          </View>
        ) : null}

        {data.topVendors.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Vendor Name</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Company</Text>
              <Text style={pdfStyles.tableCellRight}>Total Spent</Text>
              <Text style={pdfStyles.tableCellRight}>Costs</Text>
            </View>

            {data.topVendors.map((vendor, index) => (
              <View
                key={vendor.vendorId || index}
                style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlternate}
              >
                <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{vendor.vendorName}</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{vendor.company || "N/A"}</Text>
                <Text style={pdfStyles.tableCellRight}>{formatCurrency(vendor.totalSpent)}</Text>
                <Text style={pdfStyles.tableCellRight}>{vendor.costCount}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={pdfStyles.paragraph}>
            No vendor data available for the selected date range.
          </Text>
        )}

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>{getConfidentialityNotice(data.isPartnerView)}</Text>
          <Text style={pdfStyles.footerText}>Page 3</Text>
        </View>
      </Page>

      {/* Timeline */}
      <Page size="A4" style={pdfStyles.page}>
        {data.isPartnerView ? (
          <View style={pdfStyles.watermark}>
            <Text>{PDF_WATERMARK.text}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.pageHeader}>Project Timeline</Text>

        {data.timeline.length > 0 ? (
          <View>
            {/* Timeline Visualization */}
            <TimelineChart
              data={data.timeline.slice(0, 12).map((event) => ({
                date: event.date,
                title: event.title,
                category: event.category, // Use the already-mapped category field
              }))}
            />
          </View>
        ) : null}

        {data.timeline.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={pdfStyles.tableCell}>Date</Text>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>Title</Text>
              <Text style={pdfStyles.tableCell}>Category</Text>
            </View>

            {data.timeline.map((event, index) => (
              <View
                key={event.id}
                style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlternate}
              >
                <Text style={pdfStyles.tableCell}>{format(event.date, "dd/MM/yyyy")}</Text>
                <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{event.title}</Text>
                <Text style={pdfStyles.tableCell}>{event.categoryName}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={pdfStyles.paragraph}>No timeline events for the selected date range.</Text>
        )}

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>{getConfidentialityNotice(data.isPartnerView)}</Text>
          <Text style={pdfStyles.footerText}>Page 4</Text>
        </View>
      </Page>

      {/* Document Inventory */}
      <Page size="A4" style={pdfStyles.page}>
        {data.isPartnerView ? (
          <View style={pdfStyles.watermark}>
            <Text>{PDF_WATERMARK.text}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.pageHeader}>Document Inventory</Text>

        {data.documents.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>File Name</Text>
              <Text style={pdfStyles.tableCell}>Category</Text>
              <Text style={pdfStyles.tableCellRight}>Size</Text>
              <Text style={pdfStyles.tableCell}>Uploaded</Text>
            </View>

            {data.documents.slice(0, 50).map((doc, index) => (
              <View
                key={index}
                style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlternate}
              >
                <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{doc.fileName}</Text>
                <Text style={pdfStyles.tableCell}>{doc.categoryName}</Text>
                <Text style={pdfStyles.tableCellRight}>{formatFileSize(doc.fileSize)}</Text>
                <Text style={pdfStyles.tableCell}>{format(doc.uploadedAt, "dd/MM/yy")}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={pdfStyles.paragraph}>No documents uploaded to this project.</Text>
        )}

        {data.documents.length > 50 ? (
          <Text style={{ ...pdfStyles.textSmall, marginTop: 10 }}>
            Showing first 50 of {data.documents.length} documents
          </Text>
        ) : null}

        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>{getConfidentialityNotice(data.isPartnerView)}</Text>
          <Text style={pdfStyles.footerText}>Page 5</Text>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate PDF report for a project
 *
 * Main service function that orchestrates report generation:
 * 1. Verifies user access (owner or partner)
 * 2. Fetches and aggregates report data
 * 3. Generates PDF using React-PDF
 * 4. Returns PDF as Buffer for storage/download
 *
 * @param db - Database instance
 * @param input - Report generation input parameters
 * @returns PDF report as Buffer
 * @throws {TRPCError} FORBIDDEN - User doesn't have access
 * @throws {TRPCError} NOT_FOUND - Project not found
 * @throws {TRPCError} INTERNAL_SERVER_ERROR - PDF generation failed
 */
export async function generateProjectPdf(db: Database, input: PdfReportInput): Promise<Buffer> {
  try {
    // Verify user access
    await verifyAccessAndGetRole(db, input.projectId, input.userId)

    // Fetch all report data
    const reportData = await fetchReportData(db, input)

    // Serialize and deserialize data to ensure no unexpected objects
    // This prevents React Error #31 by cleaning complex objects
    const serialized = JSON.stringify(reportData, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })

    const cleanData = JSON.parse(serialized, (key, value) => {
      // Convert ISO strings back to Dates for specific fields
      if (
        key === "date" ||
        key === "uploadedAt" ||
        key === "generatedAt" ||
        key === "startDate" ||
        key === "endDate"
      ) {
        return value ? new Date(value) : null
      }
      return value
    })

    // Generate PDF using React-PDF with clean data
    const pdfElement = <ProjectReportPDF data={cleanData as ReportData} />
    const pdfBuffer = await renderToBuffer(pdfElement)

    return pdfBuffer
  } catch (error) {
    // Re-throw TRPCError as-is
    if (error instanceof TRPCError) {
      throw error
    }

    console.error("=== PDF Generation Failed ===")
    console.error("Error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    // Include error message in development for easier debugging
    const isDev = process.env.NODE_ENV === "development"
    const errorMessage =
      isDev && error instanceof Error
        ? `Failed to generate PDF report: ${error.message}`
        : "Failed to generate PDF report. Please try again."

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: errorMessage,
    })
  }
}
