"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar, Clock, User, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EventContact {
  id: string
  firstName: string
  lastName: string
  company: string | null
}

interface EventCardProps {
  event: {
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
      contact: EventContact
    }>
  }
  onEdit?: (eventId: string) => void
  onDelete?: (eventId: string) => void
}

/**
 * EventCard - Display component for a single event
 *
 * Shows event details with color-coded category badge,
 * linked contacts, and expandable description.
 *
 * Mobile-optimized with:
 * - Responsive layout (stacks on mobile)
 * - Touch-friendly expand/collapse
 * - Clear visual hierarchy
 *
 * @param event - Event data to display
 * @param onEdit - Callback when edit button clicked
 * @param onDelete - Callback when delete button clicked
 */
export function EventCard({ event, onEdit: _onEdit, onDelete: _onDelete }: EventCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Format date and time
  const eventDate = new Date(event.date)
  const dateStr = format(eventDate, "MMM d, yyyy")
  const timeStr = format(eventDate, "h:mm a")

  // Category badge color based on type
  const categoryColor = {
    milestone: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    meeting: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    inspection: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  }

  const categoryId = event.category?.id as keyof typeof categoryColor
  const badgeColor = categoryColor[categoryId] || "bg-gray-100 text-gray-800"

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{event.title}</CardTitle>
              {event.category && (
                <Badge variant="secondary" className={badgeColor}>
                  {event.category.displayName}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {timeStr}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {event.description && (
          <div>
            <div className={`text-sm text-muted-foreground ${!isExpanded && "line-clamp-2"}`}>
              {event.description}
            </div>
            {event.description.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 h-auto p-0 text-sm hover:bg-transparent"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Linked Contacts */}
        {event.eventContacts.length > 0 && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {event.eventContacts.map(({ contact }) => (
                <Badge key={contact.id} variant="outline" className="text-xs">
                  {contact.firstName} {contact.lastName}
                  {contact.company && ` (${contact.company})`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Created by info */}
        {event.createdBy && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created by {event.createdBy.firstName} {event.createdBy.lastName}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
