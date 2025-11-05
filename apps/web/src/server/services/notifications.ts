/**
 * Notification generation utilities
 * Story 8.1: In-App Notification System
 * Story 8.2: Email Notifications with User Preferences
 *
 * Provides functions for creating and sending notifications to users
 */

import { db } from "@/server/db"
import { notifications } from "@/server/db/schema/notifications"
import { projectAccess } from "@/server/db/schema/projectAccess"
import { projects } from "@/server/db/schema/projects"
import { users } from "@/server/db/schema/users"
import { eq, and, isNull, isNotNull } from "drizzle-orm"
import { NotificationType, NotificationEntityType } from "@/server/db/schema/notifications"
import {
  sendCostAddedEmailNotification,
  sendLargeExpenseEmailNotification,
  sendDocumentUploadedEmailNotification,
  sendTimelineEventEmailNotification,
} from "./email-notifications"

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
  partners.forEach((partner: { userId: string }) => userIds.add(partner.userId)) // eslint-disable-line @typescript-eslint/no-explicit-any

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
    const createdNotifications = await db
      .insert(notifications)
      .values(notificationValues)
      .returning()

    // Story 8.2: Trigger email notifications (fire-and-forget)
    // Get user records for email personalization
    const userRecords = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)

    for (const notification of createdNotifications) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userRecord = userRecords.find((u: { id: string }) => u.id === notification.userId) ?? {
        name: "User",
      }

      // Fire-and-forget email sending based on notification type
      if (params.type === NotificationType.COST_ADDED && "amount" in params.messageData) {
        sendCostAddedEmailNotification({
          userId: notification.userId,
          notificationId: notification.id,
          projectId: params.projectId,
          projectName: project.name,
          costId: params.entityId,
          costDescription: (params.messageData as { description: string }).description,
          amount: (params.messageData as { amount: number }).amount,
          userName: userRecord.name,
        }).catch((err) => console.error("Email notification error:", err))
      } else if (params.type === NotificationType.LARGE_EXPENSE && "amount" in params.messageData) {
        sendLargeExpenseEmailNotification({
          userId: notification.userId,
          notificationId: notification.id,
          projectId: params.projectId,
          projectName: project.name,
          costId: params.entityId,
          costDescription: (params.messageData as { description: string }).description,
          amount: (params.messageData as { amount: number }).amount,
          userName: userRecord.name,
        }).catch((err) => console.error("Email notification error:", err))
      } else if (
        params.type === NotificationType.DOCUMENT_UPLOADED &&
        "fileName" in params.messageData
      ) {
        sendDocumentUploadedEmailNotification({
          userId: notification.userId,
          notificationId: notification.id,
          projectId: params.projectId,
          projectName: project.name,
          documentId: params.entityId,
          fileName: (params.messageData as { fileName: string }).fileName,
          userName: userRecord.name,
        }).catch((err) => console.error("Email notification error:", err))
      } else if (
        params.type === NotificationType.TIMELINE_EVENT &&
        "eventTitle" in params.messageData
      ) {
        sendTimelineEventEmailNotification({
          userId: notification.userId,
          notificationId: notification.id,
          projectId: params.projectId,
          projectName: project.name,
          eventId: params.entityId,
          eventTitle: (params.messageData as { eventTitle: string }).eventTitle,
          eventDate: new Date(), // TODO: Pass actual event date
          userName: userRecord.name,
        }).catch((err) => console.error("Email notification error:", err))
      }
    }
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

/**
 * Notify users about a new comment
 * Story 8.3: Threaded Comments on Entities
 *
 * Recipients (deduplicated):
 * - Entity owner (cost/document/event creator)
 * - All previous commenters in the thread
 * - @mentioned users
 *
 * Excludes the comment author (no self-notification)
 */
export async function notifyCommentAdded(params: {
  commentId: string
  entityType: "cost" | "document" | "event"
  entityId: string
  projectId: string
  projectName: string
  commenterName: string
  commentAuthorId: string
  content: string
}): Promise<void> {
  const recipientIds = new Set<string>()

  // Import comments schema
  const { comments } = await import("@/server/db/schema/comments")

  // 1. Get all previous commenters in this thread (distinct user IDs)
  const previousComments = await db
    .select({ userId: comments.userId })
    .from(comments)
    .where(and(eq(comments.entityType, params.entityType), eq(comments.entityId, params.entityId)))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousComments.forEach((comment: any) => {
    recipientIds.add(comment.userId)
  })

  // 2. Get entity owner based on entity type
  try {
    let entityOwnerId: string | null = null

    if (params.entityType === "cost") {
      const { costs } = await import("@/server/db/schema/costs")
      const [cost] = await db
        .select({ createdById: costs.createdById })
        .from(costs)
        .where(eq(costs.id, params.entityId))
        .limit(1)

      entityOwnerId = cost?.createdById ?? null
    } else if (params.entityType === "document") {
      const { documents } = await import("@/server/db/schema/documents")
      const [document] = await db
        .select({ uploadedById: documents.uploadedById })
        .from(documents)
        .where(eq(documents.id, params.entityId))
        .limit(1)

      entityOwnerId = document?.uploadedById ?? null
    } else if (params.entityType === "event") {
      const { events } = await import("@/server/db/schema/events")
      const [event] = await db
        .select({ createdById: events.createdById })
        .from(events)
        .where(eq(events.id, params.entityId))
        .limit(1)

      entityOwnerId = event?.createdById ?? null
    }

    if (entityOwnerId) {
      recipientIds.add(entityOwnerId)
    }
  } catch (error) {
    console.error("Error fetching entity owner for comment notification:", error)
  }

  // 3. Parse @mentions from comment content
  // Extract @username patterns (alphanumeric + underscore)
  const mentionRegex = /@(\w+)/g
  const mentions = Array.from(params.content.matchAll(mentionRegex), (m) => m[1])

  if (mentions.length > 0) {
    try {
      // Query users by name (mentions use underscored names like @John_Doe)
      // Convert @mention format to match user names
      const mentionNames = mentions.map((mention) => mention.replace(/_/g, " "))

      // Query all mentioned users by name
      const mentionedUsers = await db.select({ id: users.id, name: users.name }).from(users)

      // Match mentioned names (case-insensitive)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchedUsers = mentionedUsers.filter((user: { id: string; name: string }) =>
        mentionNames.some((mentionName) => user.name.toLowerCase() === mentionName.toLowerCase())
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matchedUsers.forEach((user: { id: string; name: string }) => {
        recipientIds.add(user.id)
      })
    } catch (error) {
      console.error("Error fetching mentioned users:", error)
    }
  }

  // 4. Exclude comment author (no self-notification)
  recipientIds.delete(params.commentAuthorId)

  // 5. Create notifications for all unique recipients
  if (recipientIds.size === 0) {
    return // No one to notify
  }

  const message = MESSAGE_TEMPLATES[NotificationType.COMMENT_ADDED]({
    commenterName: params.commenterName,
    entityType: params.entityType,
    projectName: params.projectName,
  })

  const notificationValues = Array.from(recipientIds).map((userId) => ({
    userId,
    type: NotificationType.COMMENT_ADDED,
    entityType:
      params.entityType as (typeof NotificationEntityType)[keyof typeof NotificationEntityType],
    entityId: params.commentId,
    projectId: params.projectId,
    message,
    read: false,
  }))

  await db.insert(notifications).values(notificationValues)

  console.log(
    `Created ${notificationValues.length} comment notifications for comment ${params.commentId}`
  )
}
