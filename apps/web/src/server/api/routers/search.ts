/**
 * Search Router (Story 7.1 - Global Search with Command Palette)
 *
 * Provides global search functionality across all entity types
 * with PostgreSQL full-text search and RBAC filtering.
 *
 * @module search
 */

import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { and, isNull, inArray, sql, desc } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { projects } from "@/server/db/schema/projects"
import { costs } from "@/server/db/schema/costs"
import { contacts } from "@/server/db/schema/contacts"
import { documents } from "@/server/db/schema/documents"
import { projectContact } from "@/server/db/schema/projectContact"
import { getAccessibleProjects } from "../helpers/authorization"

/**
 * Entity type for search results
 */
const entityTypeSchema = z.enum(["project", "cost", "contact", "document"])

/**
 * Search result type
 */
export interface SearchResult {
  entityType: "project" | "cost" | "contact" | "document"
  entityId: string
  title: string
  preview: string
  projectContext?: {
    projectId: string
    projectName: string
  }
  matchedFields: string[]
  rank: number
}

/**
 * Sanitize search query for PostgreSQL ts_query
 * Converts user input into safe tsquery format
 *
 * @param query - Raw search query from user
 * @returns Sanitized tsquery string
 *
 * @example
 * sanitizeSearchQuery("kitchen renovation") // => "kitchen & renovation"
 * sanitizeSearchQuery("123 Main St") // => "123 & Main & St"
 */
function sanitizeSearchQuery(query: string): string {
  // Remove special characters that could break tsquery
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace special chars with space
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  // Split into words and join with & (AND operator)
  const words = cleaned.split(" ").filter((word) => word.length > 0)

  if (words.length === 0) {
    return ""
  }

  // Join words with & for AND search
  return words.join(" & ")
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string | null, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

/**
 * Search Router
 */
export const searchRouter = createTRPCRouter({
  /**
   * Global search across all entity types with RBAC filtering
   *
   * Searches projects, costs, contacts, and documents using PostgreSQL
   * full-text search. Results are filtered based on user's project access.
   *
   * @param query - Search query (min 2 chars, max 100 chars)
   * @param entityTypes - Optional filter by entity types
   * @param projectId - Optional filter by specific project
   * @param limit - Max results to return (default 50)
   * @returns Unified search results sorted by relevance
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} BAD_REQUEST - Invalid query or parameters
   */
  globalSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2, "Search query must be at least 2 characters").max(100),
        entityTypes: z.array(entityTypeSchema).optional(),
        projectId: z.string().uuid().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, entityTypes, projectId, dateFrom, dateTo, limit } = input

      // Sanitize query for ts_query
      const tsQuery = sanitizeSearchQuery(query)

      if (!tsQuery) {
        return {
          results: [] as SearchResult[],
          totalCount: 0,
        }
      }

      // Get accessible projects for RBAC filtering
      const accessibleProjectsData = await getAccessibleProjects(ctx)
      const accessibleProjectIds = accessibleProjectsData.map((p) => p.project.id)

      if (accessibleProjectIds.length === 0) {
        return {
          results: [] as SearchResult[],
          totalCount: 0,
        }
      }

      // Filter by specific project if requested
      const targetProjectIds = projectId ? [projectId] : accessibleProjectIds

      // Verify user has access to the specified project
      if (projectId && !accessibleProjectIds.includes(projectId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this project",
        })
      }

      const results: SearchResult[] = []

      // Determine which entity types to search
      const searchEntityTypes = entityTypes || ["project", "cost", "contact", "document"]

      // Search Projects
      if (searchEntityTypes.includes("project")) {
        const projectConditions = [
          sql`${projects.search_vector} @@ to_tsquery('english', ${tsQuery})`,
          isNull(projects.deletedAt),
          inArray(projects.id, targetProjectIds),
        ]

        // Add date range filtering if specified
        if (dateFrom) {
          projectConditions.push(sql`${projects.createdAt} >= ${dateFrom}`)
        }
        if (dateTo) {
          projectConditions.push(sql`${projects.createdAt} <= ${dateTo}`)
        }

        const projectResults = await ctx.db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            rank: sql<number>`ts_rank(${projects.search_vector}, to_tsquery('english', ${tsQuery}))`,
          })
          .from(projects)
          .where(and(...projectConditions))
          .orderBy(sql`ts_rank(${projects.search_vector}, to_tsquery('english', ${tsQuery})) DESC`)
          .limit(limit)

        projectResults.forEach(
          (project: { id: string; name: string; description: string | null; rank: number }) => {
            results.push({
              entityType: "project",
              entityId: project.id,
              title: project.name,
              preview: truncateText(project.description, 150),
              matchedFields: ["name", "description"],
              rank: project.rank,
            })
          }
        )
      }

      // Search Costs
      if (searchEntityTypes.includes("cost")) {
        const costConditions = [
          sql`${costs.search_vector} @@ to_tsquery('english', ${tsQuery})`,
          isNull(costs.deletedAt),
          inArray(costs.projectId, targetProjectIds),
        ]

        // Add date range filtering if specified
        if (dateFrom) {
          costConditions.push(sql`${costs.date} >= ${dateFrom}`)
        }
        if (dateTo) {
          costConditions.push(sql`${costs.date} <= ${dateTo}`)
        }

        const costResults = await ctx.db
          .select({
            id: costs.id,
            description: costs.description,
            amount: costs.amount,
            projectId: costs.projectId,
            rank: sql<number>`ts_rank(${costs.search_vector}, to_tsquery('english', ${tsQuery}))`,
          })
          .from(costs)
          .where(and(...costConditions))
          .orderBy(sql`ts_rank(${costs.search_vector}, to_tsquery('english', ${tsQuery})) DESC`)
          .limit(limit)

        // Get project names for context
        const costProjectIds = costResults.map((c: { projectId: string }) => c.projectId)
        const costProjects = await ctx.db.query.projects.findMany({
          where: inArray(projects.id, costProjectIds),
          columns: { id: true, name: true },
        })
        const projectNameMap = new Map(
          costProjects.map((p: { id: string; name: string }) => [p.id, p.name] as const)
        )

        costResults.forEach(
          (cost: {
            id: string
            description: string
            amount: number
            projectId: string
            rank: number
          }) => {
            results.push({
              entityType: "cost",
              entityId: cost.id,
              title: cost.description,
              preview: `Amount: $${(cost.amount / 100).toFixed(2)}`,
              projectContext: {
                projectId: cost.projectId,
                projectName: (projectNameMap.get(cost.projectId) ?? "Unknown Project") as string,
              },
              matchedFields: ["description"],
              rank: cost.rank,
            })
          }
        )
      }

      // Search Contacts
      if (searchEntityTypes.includes("contact")) {
        // Get contact IDs that are linked to accessible projects
        const accessibleContactIds = await ctx.db
          .selectDistinct({ contactId: projectContact.contactId })
          .from(projectContact)
          .where(
            and(
              inArray(projectContact.projectId, targetProjectIds),
              isNull(projectContact.deletedAt)
            )
          )

        const contactIdList = accessibleContactIds.map(
          (row: { contactId: string }) => row.contactId
        )

        if (contactIdList.length === 0) {
          // No accessible contacts, skip search
        } else {
          // Search contacts using accessible contact IDs
          const contactConditions = [
            sql`${contacts.search_vector} @@ to_tsquery('english', ${tsQuery})`,
            isNull(contacts.deletedAt),
            inArray(contacts.id, contactIdList),
          ]

          // Add date range filtering if specified
          if (dateFrom) {
            contactConditions.push(sql`${contacts.createdAt} >= ${dateFrom}`)
          }
          if (dateTo) {
            contactConditions.push(sql`${contacts.createdAt} <= ${dateTo}`)
          }

          const contactResults = await ctx.db
            .select({
              id: contacts.id,
              firstName: contacts.firstName,
              lastName: contacts.lastName,
              company: contacts.company,
              email: contacts.email,
              rank: sql<number>`ts_rank(${contacts.search_vector}, to_tsquery('english', ${tsQuery}))`,
            })
            .from(contacts)
            .where(and(...contactConditions))
            .orderBy(
              desc(
                sql<number>`ts_rank(${contacts.search_vector}, to_tsquery('english', ${tsQuery}))`
              )
            )
            .limit(limit)

          // Get project context for each contact
          const contactIds = contactResults.map((c: { id: string }) => c.id)
          if (contactIds.length > 0) {
            const contactProjectLinks = await ctx.db
              .select({
                contactId: projectContact.contactId,
                projectId: projectContact.projectId,
              })
              .from(projectContact)
              .where(
                and(
                  inArray(projectContact.contactId, contactIds),
                  inArray(projectContact.projectId, targetProjectIds),
                  isNull(projectContact.deletedAt)
                )
              )

            const linkedProjectIds = contactProjectLinks.map(
              (link: { contactId: string; projectId: string }) => link.projectId
            )
            const contactProjects = await ctx.db.query.projects.findMany({
              where: inArray(projects.id, linkedProjectIds),
              columns: { id: true, name: true },
            })
            const contactProjectMap = new Map(
              contactProjects.map((p: { id: string; name: string }) => [p.id, p.name] as const)
            )

            // Create a map of contactId to first project
            const contactToProjectMap = new Map<
              string,
              { projectId: string; projectName: string }
            >()
            contactProjectLinks.forEach((link: { contactId: string; projectId: string }) => {
              if (!contactToProjectMap.has(link.contactId)) {
                contactToProjectMap.set(link.contactId, {
                  projectId: link.projectId,
                  projectName: (contactProjectMap.get(link.projectId) ??
                    "Unknown Project") as string,
                })
              }
            })

            contactResults.forEach(
              (contact: {
                id: string
                firstName: string
                lastName: string | null
                company: string | null
                email: string | null
                rank: number
              }) => {
                const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ")
                const preview = [contact.company, contact.email].filter(Boolean).join(" • ")

                const projectContext = contactToProjectMap.get(contact.id)

                results.push({
                  entityType: "contact",
                  entityId: contact.id,
                  title: fullName,
                  preview: truncateText(preview, 150),
                  projectContext,
                  matchedFields: ["firstName", "lastName", "company", "email"],
                  rank: contact.rank,
                })
              }
            )
          }
        }
      }

      // Search Documents
      if (searchEntityTypes.includes("document")) {
        const documentConditions = [
          sql`${documents.search_vector} @@ to_tsquery('english', ${tsQuery})`,
          isNull(documents.deletedAt),
          inArray(documents.projectId, targetProjectIds),
        ]

        // Add date range filtering if specified
        if (dateFrom) {
          documentConditions.push(sql`${documents.createdAt} >= ${dateFrom}`)
        }
        if (dateTo) {
          documentConditions.push(sql`${documents.createdAt} <= ${dateTo}`)
        }

        const documentResults = await ctx.db
          .select({
            id: documents.id,
            fileName: documents.fileName,
            mimeType: documents.mimeType,
            fileSize: documents.fileSize,
            projectId: documents.projectId,
            rank: sql<number>`ts_rank(${documents.search_vector}, to_tsquery('english', ${tsQuery}))`,
          })
          .from(documents)
          .where(and(...documentConditions))
          .orderBy(sql`ts_rank(${documents.search_vector}, to_tsquery('english', ${tsQuery})) DESC`)
          .limit(limit)

        // Get project names for context
        const docProjectIds = documentResults.map((d: { projectId: string }) => d.projectId)
        const docProjects = await ctx.db.query.projects.findMany({
          where: inArray(projects.id, docProjectIds),
          columns: { id: true, name: true },
        })
        const docProjectNameMap = new Map(
          docProjects.map((p: { id: string; name: string }) => [p.id, p.name] as const)
        )

        documentResults.forEach(
          (doc: {
            id: string
            fileName: string
            mimeType: string
            fileSize: number
            projectId: string
            rank: number
          }) => {
            const fileSizeKB = (doc.fileSize / 1024).toFixed(1)
            results.push({
              entityType: "document",
              entityId: doc.id,
              title: doc.fileName,
              preview: `${doc.mimeType} • ${fileSizeKB} KB`,
              projectContext: {
                projectId: doc.projectId,
                projectName: (docProjectNameMap.get(doc.projectId) ?? "Unknown Project") as string,
              },
              matchedFields: ["fileName"],
              rank: doc.rank,
            })
          }
        )
      }

      // Sort all results by relevance rank (descending)
      results.sort((a, b) => b.rank - a.rank)

      // Limit total results
      const limitedResults = results.slice(0, limit)

      return {
        results: limitedResults,
        totalCount: results.length,
      }
    }),
})
