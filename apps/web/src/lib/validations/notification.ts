/**
 * Validation schemas for notification operations
 * Story 8.1: In-App Notification System
 */

import { z } from "zod"

/**
 * Schema for listing notifications with pagination
 */
export const listNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  unreadOnly: z.boolean().optional().default(false),
  projectId: z.string().uuid().optional(),
})

/**
 * Schema for marking a single notification as read
 */
export const markNotificationAsReadSchema = z.object({
  id: z.string().uuid(),
})

/**
 * Schema for marking all notifications as read
 */
export const markAllAsReadSchema = z.object({
  projectId: z.string().uuid().optional(),
})

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>
export type MarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadSchema>
export type MarkAllAsReadInput = z.infer<typeof markAllAsReadSchema>
