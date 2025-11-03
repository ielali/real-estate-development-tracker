/**
 * Notification generation utilities
 * Story 8.1: In-App Notification System
 *
 * Provides functions for creating and sending notifications to users
 */

import { db } from "@/server/db"
import { notifications } from "@/server/db/schema/notifications"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { projects } from "@/server/db/schema/projects"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import { NotificationType, NotificationEntityType } from "@/server/db/schema/notifications"

/**
 * Message templates for different notification types
 */
const MESSAGE_TEMPLATES = {
  [NotificationType.COST_ADDED]: (data: {
    description: string
    amount: number
    projectName: string
  }) => {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(data.amount / 100)
    return `New cost added: ${data.description} (${formattedAmount}) in ${data.projectName}`
  },

  [NotificationType.LARGE_EXPENSE]: (data: {
    description: string
    amount: number
    projectName: string
  }) => {
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(data.amount / 100)
    return `Large expense alert: ${data.description} (${formattedAmount}) in ${data.projectName}`
  },

  [NotificationType.DOCUMENT_UPLOADED]: (data: { fileName: string; projectName: string }) =>
    `New document uploaded: ${data.fileName} in ${data.projectName}`,

  [NotificationType.TIMELINE_EVENT]: (data: { eventTitle: string; projectName: string }) =>
    `New timeline event: ${data.eventTitle} in ${data.projectName}`,

  [NotificationType.PARTNER_INVITED]: (data: { projectName: string; inviterName: string }) =>
    `${data.inviterName} invited you to collaborate on ${data.projectName}`,

  [NotificationType.COMMENT_ADDED]: (data: {
    commenterName: string
    entityType: string
    projectName: string
  }) => `${data.commenterName} commented on ${data.entityType} in ${data.projectName}`,
} as const

/**
 * Create a notification for a specific user
 *
 * AC #10: createNotification function
 */
export async function createNotification(params: {
  userId: string
  type: (typeof NotificationType)[keyof typeof NotificationType]
  entityType: (typeof NotificationEntityType)[keyof typeof NotificationEntityType]
  entityId: string
  projectId: string | null
  message: string
}): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    projectId: params.projectId,
    message: params.message,
    read: false,
  })
}

/**
 * Notify all project members (owner + partners with accepted access)
 *
 * Excludes the acting user (to avoid self-notification)
 * AC #11: notifyProjectMembers function
 */
export async function notifyProjectMembers(params: {
  projectId: string
  excludeUserId?: string
  type: (typeof NotificationType)[keyof typeof NotificationType]
  entityType: (typeof NotificationEntityType)[keyof typeof NotificationEntityType]
  entityId: string
  messageData: Record<string, unknown>
}): Promise<void> {
  // Get project owner
  const [project] = await db
    .select({
      ownerId: projects.ownerId,
      name: projects.name,
    })
    .from(projects)
    .where(and(eq(projects.id, params.projectId), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) {
    console.warn(`Project ${params.projectId} not found for notification`)
    return
  }

  // Get all partners with accepted access
  const partners = await db
    .select({
      userId: projectAccess.userId,
    })
    .from(projectAccess)
    .where(
      and(
        eq(projectAccess.projectId, params.projectId),
        isNotNull(projectAccess.acceptedAt),
        isNull(projectAccess.deletedAt)
      )
    )

  // Collect all user IDs to notify
  const userIds = new Set<string>()
  userIds.add(project.ownerId)
  partners.forEach((partner: { userId: string }) => userIds.add(partner.userId))

  // Remove excluded user
  if (params.excludeUserId) {
    userIds.delete(params.excludeUserId)
  }

  // Generate message using template
  const messageTemplate = MESSAGE_TEMPLATES[params.type]
  const message = messageTemplate ? messageTemplate(params.messageData as never) : "New activity"

  // Create notification for each user
  const notificationValues = Array.from(userIds).map((userId) => ({
    userId,
    type: params.type,
    entityType: params.entityType,
    entityId: params.entityId,
    projectId: params.projectId,
    message,
    read: false,
  }))

  if (notificationValues.length > 0) {
    await db.insert(notifications).values(notificationValues)
  }
}

/**
 * Convenience functions for common notification types
 */

export async function notifyCostAdded(params: {
  projectId: string
  costId: string
  description: string
  amount: number
  projectName: string
  excludeUserId?: string
}): Promise<void> {
  await notifyProjectMembers({
    projectId: params.projectId,
    excludeUserId: params.excludeUserId,
    type: NotificationType.COST_ADDED,
    entityType: NotificationEntityType.COST,
    entityId: params.costId,
    messageData: {
      description: params.description,
      amount: params.amount,
      projectName: params.projectName,
    },
  })
}

export async function notifyLargeExpense(params: {
  projectId: string
  costId: string
  description: string
  amount: number
  projectName: string
  excludeUserId?: string
}): Promise<void> {
  await notifyProjectMembers({
    projectId: params.projectId,
    excludeUserId: params.excludeUserId,
    type: NotificationType.LARGE_EXPENSE,
    entityType: NotificationEntityType.COST,
    entityId: params.costId,
    messageData: {
      description: params.description,
      amount: params.amount,
      projectName: params.projectName,
    },
  })
}

export async function notifyDocumentUploaded(params: {
  projectId: string
  documentId: string
  fileName: string
  projectName: string
  excludeUserId?: string
}): Promise<void> {
  await notifyProjectMembers({
    projectId: params.projectId,
    excludeUserId: params.excludeUserId,
    type: NotificationType.DOCUMENT_UPLOADED,
    entityType: NotificationEntityType.DOCUMENT,
    entityId: params.documentId,
    messageData: {
      fileName: params.fileName,
      projectName: params.projectName,
    },
  })
}

export async function notifyTimelineEvent(params: {
  projectId: string
  eventId: string
  eventTitle: string
  projectName: string
  excludeUserId?: string
}): Promise<void> {
  await notifyProjectMembers({
    projectId: params.projectId,
    excludeUserId: params.excludeUserId,
    type: NotificationType.TIMELINE_EVENT,
    entityType: NotificationEntityType.EVENT,
    entityId: params.eventId,
    messageData: {
      eventTitle: params.eventTitle,
      projectName: params.projectName,
    },
  })
}

export async function notifyPartnerInvited(params: {
  userId: string
  projectId: string
  projectName: string
  inviterName: string
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: NotificationType.PARTNER_INVITED,
    entityType: NotificationEntityType.PROJECT,
    entityId: params.projectId,
    projectId: params.projectId,
    message: MESSAGE_TEMPLATES[NotificationType.PARTNER_INVITED]({
      projectName: params.projectName,
      inviterName: params.inviterName,
    }),
  })
}
