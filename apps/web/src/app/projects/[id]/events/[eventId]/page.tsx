"use client"

import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Clock, User, ArrowLeft } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { CommentThread } from "@/components/comments/CommentThread"

/**
 * Event Detail Page
 *
 * Displays full event details including:
 * - Event information (title, date, time, description, category)
 * - Linked contacts
 * - Comment thread for discussion
 *
 * Route: /projects/[id]/events/[eventId]
 */
export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  if (!params) return null
  const projectId = params.id as string
  const eventId = params.eventId as string

  // Fetch project for breadcrumb and owner ID
  const { data: project, isLoading: projectLoading } = api.projects.getById.useQuery({
    id: projectId,
  })

  // Fetch event data
  const { data: events, isLoading: eventsLoading } = api.events.list.useQuery({
    projectId,
  })

  const event = events?.events.find((e: any) => e.id === eventId)

  const isLoading = projectLoading || eventsLoading

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </>
    )
  }

  if (!project || !event) {
    return (
      <>
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">
              {!project ? "Project not found" : "Event not found"}
            </p>
            <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
          </div>
        </div>
      </>
    )
  }

  const breadcrumbItems = [
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${projectId}` },
    { label: "Events", href: `/projects/${projectId}/events` },
    { label: event.title },
  ]

  // Format date and time
  const eventDate = new Date(event.date)
  const dateStr = format(eventDate, "EEEE, MMMM d, yyyy")
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
    <>
      <Navbar />
      <div className="container max-w-4xl py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/events` as never)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Timeline
        </Button>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  {event.category && (
                    <Badge variant="secondary" className={badgeColor}>
                      {event.category.displayName}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-4 text-base flex-wrap">
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

          <CardContent className="space-y-4">
            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Linked Contacts */}
            {event.eventContacts && event.eventContacts.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contacts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {event.eventContacts.map(({ contact }: any) => (
                    <Badge key={contact.id} variant="outline">
                      {contact.firstName} {contact.lastName}
                      {contact.company && ` (${contact.company})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Created by info */}
            {event.createdBy && (
              <div className="pt-4 border-t text-sm text-muted-foreground">
                Created by {event.createdBy.firstName} {event.createdBy.lastName}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CommentThread
              entityType="event"
              entityId={eventId}
              projectId={projectId}
              projectOwnerId={project.ownerId}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
