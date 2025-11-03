/**
 * Notification Navigation Utilities
 * Story 8.1: In-App Notification System (AC #10, #11)
 *
 * Generates navigation URLs based on notification entity type
 * Maps notification entities to their corresponding app routes
 */

interface NotificationNavigationParams {
  entityType: string
  entityId: string
  projectId: string | null
}

/**
 * Generate navigation URL for a notification
 *
 * Routes:
 * - cost: /projects/[projectId]?tab=costs&costId=[entityId]
 * - document: /projects/[projectId]?tab=documents
 * - event: /projects/[projectId]?tab=timeline
 * - project: /projects/[projectId]
 *
 * @param notification - Notification data with entity info
 * @returns URL string for Next.js router navigation
 */
export function getNotificationNavigationUrl(notification: NotificationNavigationParams): string {
  const { entityType, entityId, projectId } = notification

  // If no project ID, navigate to projects list
  if (!projectId) {
    return "/projects"
  }

  switch (entityType) {
    case "cost":
      // Navigate to costs tab with cost ID for highlighting/scrolling
      return `/projects/${projectId}?tab=costs&costId=${entityId}`

    case "document":
      // Navigate to documents tab
      return `/projects/${projectId}?tab=documents`

    case "event":
      // Navigate to timeline tab
      return `/projects/${projectId}?tab=timeline`

    case "project":
      // Navigate to project overview
      return `/projects/${projectId}`

    default:
      // Fallback to project page
      return `/projects/${projectId}`
  }
}

/**
 * Check if a notification entity type is navigable
 *
 * @param entityType - The notification entity type
 * @returns true if entity type supports navigation
 */
export function isNavigableNotification(entityType: string): boolean {
  return ["cost", "document", "event", "project"].includes(entityType)
}
