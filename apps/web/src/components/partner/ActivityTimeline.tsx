/**
 * ActivityTimeline Component
 *
 * Story 4.3 - Partner Dashboard
 *
 * Displays audit log entries in a timeline format:
 * - User avatar/initials
 * - Action description with icons
 * - Formatted timestamps
 * - Grouped by date (Today, Yesterday, This Week, Older)
 * - Pagination support
 *
 * Features:
 * - Responsive design
 * - Action-specific icons
 * - Date grouping
 * - Load more functionality
 * - Empty state handling
 * - Framer Motion animations
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DollarSign,
  FileText,
  Calendar,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  Activity as ActivityIcon,
} from "lucide-react"
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"

export interface ActivityItem {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  metadata: {
    displayName?: string
    amount?: number
    fileName?: string
  } | null
  timestamp: Date
}

export interface ActivityTimelineProps {
  activities: ActivityItem[]
  hasMore?: boolean
  onLoadMore?: () => void
  isLoading?: boolean
}

// Get action icon based on entity type and action
function getActionIcon(entityType: string, action: string) {
  if (action === "create" || action === "insert") {
    if (entityType === "cost") return <DollarSign className="h-4 w-4" />
    if (entityType === "document") return <FileText className="h-4 w-4" />
    if (entityType === "event") return <Calendar className="h-4 w-4" />
    if (entityType === "project_access") return <UserPlus className="h-4 w-4" />
    return <Plus className="h-4 w-4" />
  }
  if (action === "update") return <Edit className="h-4 w-4" />
  if (action === "delete") return <Trash2 className="h-4 w-4" />
  return <ActivityIcon className="h-4 w-4" />
}

// Get action color based on action type
function getActionColor(action: string) {
  if (action === "create" || action === "insert") return "bg-green-100 text-green-700"
  if (action === "update") return "bg-blue-100 text-blue-700"
  if (action === "delete") return "bg-red-100 text-red-700"
  return "bg-gray-100 text-gray-700"
}

// Format action message
function formatActionMessage(activity: ActivityItem) {
  const { action, entityType, metadata } = activity

  let message = ""
  if (action === "create" || action === "insert") {
    message = "added"
  } else if (action === "update") {
    message = "updated"
  } else if (action === "delete") {
    message = "deleted"
  } else {
    message = action
  }

  let entity = entityType.replace("_", " ")
  if (metadata?.displayName) {
    entity = metadata.displayName
  } else if (metadata?.fileName) {
    entity = metadata.fileName
  }

  return `${message} ${entity}`
}

// Group activities by date
function groupActivitiesByDate(activities: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  }

  activities.forEach((activity) => {
    const activityDate = new Date(activity.timestamp)
    if (isToday(activityDate)) {
      groups.Today.push(activity)
    } else if (isYesterday(activityDate)) {
      groups.Yesterday.push(activity)
    } else if (isThisWeek(activityDate)) {
      groups["This Week"].push(activity)
    } else {
      groups.Older.push(activity)
    }
  })

  return groups
}

// Get user initials from name
function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function ActivityTimeline({
  activities,
  hasMore = false,
  onLoadMore,
  isLoading = false,
}: ActivityTimelineProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Today", "Yesterday"]))

  // Empty state
  if (activities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Project timeline and updates</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No recent activity</p>
          <p className="text-sm text-muted-foreground mt-1">Project updates will appear here</p>
        </CardContent>
      </Card>
    )
  }

  const groupedActivities = groupActivitiesByDate(activities)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {activities.length} {activities.length === 1 ? "update" : "updates"} in the last 30 days
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {Object.entries(groupedActivities).map(([groupName, groupActivities]) => {
            if (groupActivities.length === 0) return null

            const isExpanded = expandedGroups.has(groupName)

            return (
              <div key={groupName} className="space-y-3">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedGroups)
                    if (isExpanded) {
                      newExpanded.delete(groupName)
                    } else {
                      newExpanded.add(groupName)
                    }
                    setExpandedGroups(newExpanded)
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{groupName}</span>
                  <span className="text-xs">({groupActivities.length})</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {groupActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex gap-3 items-start"
                        >
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(activity.userName)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div
                                className={`rounded-full p-1 flex-shrink-0 ${getActionColor(activity.action)}`}
                              >
                                {getActionIcon(activity.entityType, activity.action)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-medium">{activity.userName}</span>{" "}
                                  <span className="text-muted-foreground">
                                    {formatActionMessage(activity)}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.timestamp), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-4">
              <Button onClick={onLoadMore} variant="outline" disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
