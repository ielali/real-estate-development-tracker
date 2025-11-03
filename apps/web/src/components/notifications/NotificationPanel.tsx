/**
 * NotificationPanel Component
 * Story 8.1: In-App Notification System
 *
 * Displays list of notifications grouped by date with actions
 *
 * Features:
 * - Grouped by date (Today, Yesterday, This Week, Older) (AC #5)
 * - Notification items with icons, messages, timestamps (AC #6)
 * - Click to mark as read (AC #7, #8)
 * - "Mark all as read" button (AC #13)
 * - Loading and empty states (AC #12)
 * - Real-time updates via React Query polling
 */

"use client"

import { useEffect } from "react"
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"
import {
  DollarSign,
  FileText,
  Calendar,
  UserPlus,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { getNotificationNavigationUrl } from "@/lib/utils/notification-navigation"

interface NotificationPanelProps {
  onClose?: () => void
}

// Get icon based on notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case "cost_added":
      return <DollarSign className="h-4 w-4" />
    case "large_expense":
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    case "document_uploaded":
      return <FileText className="h-4 w-4" />
    case "timeline_event":
      return <Calendar className="h-4 w-4" />
    case "partner_invited":
      return <UserPlus className="h-4 w-4" />
    case "comment_added":
      return <MessageSquare className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

// Group notifications by date category
function groupNotificationsByDate(
  notifications: Array<{
    id: string
    createdAt: Date
    read: boolean
    message: string
    type: string
    entityType: string
    entityId: string
    projectId: string | null
    project: { id: string; name: string } | null
  }>
) {
  const groups: Record<string, typeof notifications> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  }

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt)
    if (isToday(date)) {
      groups.Today.push(notification)
    } else if (isYesterday(date)) {
      groups.Yesterday.push(notification)
    } else if (isThisWeek(date, { weekStartsOn: 0 })) {
      groups["This Week"].push(notification)
    } else {
      groups.Older.push(notification)
    }
  })

  return groups
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const utils = api.useUtils()

  // Fetch notifications with 30-second polling (AC #9)
  const { data: notifications = [], isLoading } = api.notifications.list.useQuery(
    { limit: 50, offset: 0 },
    {
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true,
    }
  )

  // Mark single notification as read
  const markAsReadMutation = api.notifications.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notifications.list.invalidate()
      void utils.notifications.getUnreadCount.invalidate()
    },
  })

  // Mark all as read
  const markAllAsReadMutation = api.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notifications.list.invalidate()
      void utils.notifications.getUnreadCount.invalidate()
    },
  })

  const handleNotificationClick = (notification: {
    id: string
    read: boolean
    entityType: string
    entityId: string
    projectId: string | null
  }) => {
    // Mark as read if unread (AC #8)
    if (!notification.read) {
      markAsReadMutation.mutate({ id: notification.id })
    }

    // Navigate to entity (AC #10, #11)
    const url = getNotificationNavigationUrl({
      entityType: notification.entityType,
      entityId: notification.entityId,
      projectId: notification.projectId,
    })

    // Close the notification panel first
    if (onClose) {
      onClose()
    }

    // Use hard navigation to ensure page loads with new params
    // This is necessary because router.push may not trigger re-render when on same page
    window.location.href = url
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate({})
  }

  // Auto-refresh on mount
  useEffect(() => {
    void utils.notifications.list.invalidate()
    void utils.notifications.getUnreadCount.invalidate()
  }, [utils])

  const groupedNotifications = groupNotificationsByDate(notifications)
  const hasUnread = notifications.some((n: { read: boolean }) => !n.read)

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Loading state (AC #12) */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      )}

      {/* Empty state (AC #12) */}
      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            You&apos;ll see updates about your projects here
          </p>
        </div>
      )}

      {/* Notifications list (AC #5, #6) */}
      {!isLoading && notifications.length > 0 && (
        <ScrollArea className="flex-1">
          <div className="p-2">
            {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => {
              if (groupNotifications.length === 0) return null

              return (
                <div key={dateGroup} className="mb-4">
                  {/* Date group header */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {dateGroup}
                    </p>
                  </div>

                  {/* Notifications in this group */}
                  {groupNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full text-left px-3 py-3 rounded-md transition-colors hover:bg-accent",
                          !notification.read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              "mt-0.5 flex-shrink-0",
                              !notification.read && "text-primary"
                            )}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm",
                                !notification.read ? "font-medium" : "text-muted-foreground"
                              )}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            </div>
                          )}
                        </div>
                      </button>
                      {index < groupNotifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
