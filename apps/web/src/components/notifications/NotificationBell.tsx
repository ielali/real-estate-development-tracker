/**
 * NotificationBell Component
 * Story 8.1: In-App Notification System
 *
 * Bell icon with unread count badge that triggers notification panel popover
 *
 * Features:
 * - Bell icon button in header
 * - Badge displaying unread count (AC #4)
 * - Popover trigger for NotificationPanel
 * - Real-time updates via React Query polling (30s)
 * - Accessible ARIA labels
 */

"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/trpc/client"
import { NotificationPanel } from "./NotificationPanel"
import { useState } from "react"

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  // Fetch unread count with 30-second polling (AC #9)
  const { data: unreadCount = 0 } = api.notifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <NotificationPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
