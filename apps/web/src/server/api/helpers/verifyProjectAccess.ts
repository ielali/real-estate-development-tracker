import { TRPCError } from "@trpc/server"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import { projects } from "@/server/db/schema/projects"
import { projectAccess } from "@/server/db/schema/projectAccess"
import type { Database } from "@/server/db"

/**
 * Helper function to verify project access (owner or partner)
 *
 * Checks if the user has permission to access a project, either as:
 * - The project owner
 * - A partner with granted access via projectAccess
 *
 * @param db - Database instance
 * @param projectId - Project ID to check access for
 * @param userId - User ID to verify
 * @throws {TRPCError} NOT_FOUND - Project not found or deleted
 * @throws {TRPCError} FORBIDDEN - User does not have access to project
 */
export async function verifyProjectAccess(
  db: Database,
  projectId: string,
  userId: string
): Promise<void> {
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project[0]) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    })
  }

  // Check if user is owner
  if (project[0].ownerId === userId) {
    return
  }

  // Check if user has accepted partner access
  const access = await db
    .select()
    .from(projectAccess)
    .where(
      and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, userId),
        isNotNull(projectAccess.acceptedAt), // Only accepted invitations grant access
        isNull(projectAccess.deletedAt)
      )
    )
    .limit(1)

  if (!access[0]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this project",
    })
  }
}
