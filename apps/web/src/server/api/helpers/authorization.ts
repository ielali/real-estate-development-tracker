/**
 * Authorization Helper Functions for tRPC Procedures
 *
 * Centralized authorization logic to ensure consistent access control
 * across all API routes. These helpers prevent code duplication and
 * provide standardized error messages.
 *
 * @module authorization
 */

import { TRPCError } from "@trpc/server"
import { eq, and, isNull } from "drizzle-orm"
import { projects, projectAccess } from "@/server/db/schema"
import type { createTRPCContext } from "../trpc"

type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * Project with access level information
 */
export interface ProjectWithAccess {
  project: typeof projects.$inferSelect
  access: "owner" | "partner"
  permission?: "read" | "write"
}

/**
 * Verify that the authenticated user owns the specified project
 *
 * @param ctx - tRPC context with database and user
 * @param projectId - UUID of the project to check
 * @returns Project if user is owner
 * @throws {TRPCError} FORBIDDEN if user doesn't own project or project doesn't exist
 *
 * @example
 * ```typescript
 * const project = await verifyProjectOwnership(ctx, input.projectId)
 * // Now safe to perform owner-only operations
 * ```
 */
export async function verifyProjectOwnership(
  ctx: Context,
  projectId: string
): Promise<typeof projects.$inferSelect> {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    })
  }

  const project = await ctx.db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.ownerId, ctx.user.id),
      isNull(projects.deletedAt)
    ),
  })

  if (!project) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Project not found or you do not have ownership access",
    })
  }

  return project
}

/**
 * Verify that the authenticated user has access to the specified project
 *
 * Checks both project ownership and partner access. Partners can have
 * either 'read' or 'write' permissions.
 *
 * @param ctx - tRPC context with database and user
 * @param projectId - UUID of the project to check
 * @param requiredPermission - Minimum permission level required ('read' or 'write')
 * @returns Project with access information
 * @throws {TRPCError} FORBIDDEN if user doesn't have required access
 *
 * @example
 * ```typescript
 * // Allow read access (owner or partner with read/write)
 * const { project, access } = await verifyProjectAccess(ctx, input.projectId, 'read')
 *
 * // Require write access (owner or partner with write permission)
 * const { project, access } = await verifyProjectAccess(ctx, input.projectId, 'write')
 * if (access === 'partner') {
 *   // Partner is making changes - log extra audit info
 * }
 * ```
 */
export async function verifyProjectAccess(
  ctx: Context,
  projectId: string,
  requiredPermission: "read" | "write" = "read"
): Promise<ProjectWithAccess> {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    })
  }

  // Check ownership first (owners have full access)
  const ownedProject = await ctx.db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.ownerId, ctx.user.id),
      isNull(projects.deletedAt)
    ),
  })

  if (ownedProject) {
    return {
      project: ownedProject,
      access: "owner",
      permission: "write", // Owners always have write access
    }
  }

  // Check partner access
  const partnerAccess = await ctx.db.query.projectAccess.findFirst({
    where: and(
      eq(projectAccess.projectId, projectId),
      eq(projectAccess.userId, ctx.user.id),
      isNull(projectAccess.deletedAt),
      // If write permission required, filter to only write access
      requiredPermission === "write" ? eq(projectAccess.permission, "write") : undefined
    ),
    with: {
      project: true,
    },
  })

  if (!partnerAccess?.project) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        requiredPermission === "write"
          ? "Project not found or you do not have write access"
          : "Project not found or you do not have access",
    })
  }

  // Additional check: ensure project is not deleted
  if (partnerAccess.project.deletedAt) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This project has been deleted",
    })
  }

  return {
    project: partnerAccess.project,
    access: "partner",
    permission: partnerAccess.permission as "read" | "write",
  }
}

/**
 * Verify that the authenticated user has access to multiple projects
 *
 * Useful for bulk operations where multiple projects are involved.
 * Returns only the projects that the user has access to.
 *
 * @param ctx - tRPC context with database and user
 * @param projectIds - Array of project UUIDs to check
 * @param requiredPermission - Minimum permission level required
 * @returns Array of accessible projects with access info
 *
 * @example
 * ```typescript
 * const accessibleProjects = await verifyMultipleProjectsAccess(
 *   ctx,
 *   input.projectIds,
 *   'read'
 * )
 * // accessibleProjects.length may be less than input.projectIds.length
 * ```
 */
export async function verifyMultipleProjectsAccess(
  ctx: Context,
  projectIds: string[],
  requiredPermission: "read" | "write" = "read"
): Promise<ProjectWithAccess[]> {
  const results: ProjectWithAccess[] = []

  // Check each project individually
  // Note: Could be optimized with a single query if needed for performance
  for (const projectId of projectIds) {
    try {
      const access = await verifyProjectAccess(ctx, projectId, requiredPermission)
      results.push(access)
    } catch (error) {
      // Skip projects user doesn't have access to
      continue
    }
  }

  return results
}

/**
 * Verify that a specific entity belongs to an accessible project
 *
 * Generic helper for checking access to project-related entities
 * (costs, documents, events, etc.)
 *
 * @param ctx - tRPC context with database and user
 * @param entity - Entity with projectId field
 * @param entityType - Type of entity for error messages
 * @param requiredPermission - Minimum permission level required
 * @returns Project with access information
 * @throws {TRPCError} NOT_FOUND if entity doesn't exist or FORBIDDEN if no access
 *
 * @example
 * ```typescript
 * const cost = await ctx.db.query.costs.findFirst({
 *   where: eq(costs.id, input.costId)
 * })
 *
 * if (!cost) {
 *   throw new TRPCError({ code: 'NOT_FOUND', message: 'Cost not found' })
 * }
 *
 * const { project, access } = await verifyEntityAccess(
 *   ctx,
 *   cost,
 *   'cost',
 *   'write'
 * )
 * ```
 */
export async function verifyEntityAccess<T extends { projectId: string }>(
  ctx: Context,
  entity: T | null,
  entityType: string,
  requiredPermission: "read" | "write" = "read"
): Promise<ProjectWithAccess> {
  if (!entity) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found`,
    })
  }

  return await verifyProjectAccess(ctx, entity.projectId, requiredPermission)
}

/**
 * Assert that user is project owner (throws if partner)
 *
 * Some operations should only be allowed by project owners,
 * not partners (e.g., deleting project, removing partners, etc.)
 *
 * @param access - ProjectWithAccess returned from verifyProjectAccess
 * @param operationName - Name of operation for error message
 * @throws {TRPCError} FORBIDDEN if user is not owner
 *
 * @example
 * ```typescript
 * const { project, access } = await verifyProjectAccess(ctx, input.projectId)
 * assertProjectOwner(access, 'delete project')
 * // Now safe to delete project
 * ```
 */
export function assertProjectOwner(
  access: ProjectWithAccess,
  operationName: string = "this operation"
): void {
  if (access.access !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Only project owners can ${operationName}`,
    })
  }
}

/**
 * Check if user has write access based on ProjectWithAccess
 *
 * Convenience function to check if the access level allows writing.
 * Owners always have write access, partners depend on their permission.
 *
 * @param access - ProjectWithAccess returned from verifyProjectAccess
 * @returns true if user can write, false otherwise
 *
 * @example
 * ```typescript
 * const { project, access } = await verifyProjectAccess(ctx, input.projectId, 'read')
 * if (hasWriteAccess(access)) {
 *   // Show edit buttons
 * }
 * ```
 */
export function hasWriteAccess(access: ProjectWithAccess): boolean {
  return access.access === "owner" || access.permission === "write"
}

/**
 * Get user's permission level for a project
 *
 * Returns 'none' if no access, 'read' for read-only partners,
 * 'write' for write partners or owners.
 *
 * @param ctx - tRPC context with database and user
 * @param projectId - UUID of the project to check
 * @returns Permission level ('none', 'read', or 'write')
 *
 * @example
 * ```typescript
 * const permission = await getProjectPermissionLevel(ctx, input.projectId)
 * if (permission === 'none') {
 *   throw new TRPCError({ code: 'FORBIDDEN' })
 * }
 * ```
 */
export async function getProjectPermissionLevel(
  ctx: Context,
  projectId: string
): Promise<"none" | "read" | "write"> {
  try {
    const access = await verifyProjectAccess(ctx, projectId, "read")
    return hasWriteAccess(access) ? "write" : "read"
  } catch (error) {
    return "none"
  }
}
