"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { EventCard } from "./EventCard"
import { Skeleton } from "@/components/ui/skeleton"

interface TimelineProps {
  projectId: string
  filters?: {
    categoryId?: string
    contactId?: string
    startDate?: Date
    endDate?: Date
  }
}

interface Event {
  id: string
  title: string
  description: string | null
  date: Date
  category: {
    id: string
    displayName: string
  } | null
  createdBy: {
    firstName: string | null
    lastName: string | null
  } | null
  eventContacts: Array<{
    contact: {
      id: string
      firstName: string
      lastName: string
      company: string | null
    }
  }>
}

/**
 * Timeline - Display component for project events in chronological order
 *
 * Groups events by month/year with visual markers.
 * Shows events in reverse chronological order (newest first).
 *
 * Mobile-optimized with:
 * - Responsive layout (vertical timeline)
 * - Loading skeletons for initial load
 * - Empty state with clear messaging
 * - Efficient rendering with grouped events
 *
 * @param projectId - Project ID to load events for
 * @param filters - Optional filters for category, contact, date range
 */
export function Timeline({ projectId, filters }: TimelineProps) {
  const { data, isLoading, error } = api.events.list.useQuery({
    projectId,
    categoryId: filters?.categoryId,
    contactId: filters?.contactId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  })

  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-2">Failed to load events</div>
        <div className="text-sm text-muted-foreground">{error.message}</div>
      </div>
    )
  }

  if (!data?.events || data.events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first event to start tracking project milestones
        </p>
      </div>
    )
  }

  // Group events by month/year
  const groupedEvents = groupEventsByMonth(data.events as Event[])

  return (
    <div className="space-y-8" role="feed" aria-label="Project timeline">
      {Object.entries(groupedEvents).map(([monthYear, events]) => (
        <div key={monthYear}>
          {/* Month/Year Marker */}
          <div className="sticky top-0 z-10 bg-background py-2 mb-4">
            <h3 className="text-lg font-semibold text-muted-foreground">{monthYear}</h3>
            <div className="h-px bg-border mt-2" />
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Group events by month and year
 * Returns object with "Month YYYY" keys and event arrays
 */
function groupEventsByMonth(events: Event[]): Record<string, Event[]> {
  return events.reduce(
    (groups, event) => {
      const key = format(new Date(event.date), "MMMM yyyy")
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(event)
      return groups
    },
    {} as Record<string, Event[]>
  )
}

/**
 * Loading skeleton for timeline
 */
function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {/* Month header skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-px w-full mb-4" />

        {/* Event card skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
