"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Timeline, EventEntryForm, TimelineFilter } from "@/components/events"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"
import { EventQuickActions } from "@/components/navigation/quick-actions"

/**
 * EventsPage - Display and manage project events
 *
 * Shows chronological timeline of project milestones, meetings, and inspections.
 * Provides filtering by event type and quick event creation.
 *
 * Mobile-optimized with floating action button for quick event entry.
 */
export default function EventsPage() {
  const params = useParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>()
  const [contactFilter, setContactFilter] = React.useState<string | undefined>()
  const [dateRangeStart, setDateRangeStart] = React.useState<Date | undefined>()
  const [dateRangeEnd, setDateRangeEnd] = React.useState<Date | undefined>()

  if (!params) return null
  const projectId = params.id as string

  const { data: project, isLoading } = api.projects.getById.useQuery({ id: projectId })

  const handleEventCreated = () => {
    setDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="px-6 py-10 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="px-6 py-10 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Project not found</p>
          <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-10 max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbHelpers.projectEvents(project.name, projectId)} />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Timeline & Events</h1>
          <p className="text-muted-foreground">
            Track milestones, meetings, and inspections for {project.name}
          </p>
        </div>

        {/* Desktop: Event Quick Actions */}
        <EventQuickActions projectId={projectId} onAddEvent={() => setDialogOpen(true)} />

        {/* Event Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Add a new milestone, meeting, or inspection to your project timeline
              </DialogDescription>
            </DialogHeader>
            <EventEntryForm
              projectId={projectId}
              onSuccess={handleEventCreated}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Events</CardTitle>
          <CardDescription>Narrow down the timeline by type, contact, or date</CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineFilter
            categoryId={categoryFilter}
            onCategoryChange={setCategoryFilter}
            contactId={contactFilter}
            onContactChange={setContactFilter}
            startDate={dateRangeStart}
            endDate={dateRangeEnd}
            onDateRangeChange={(start, end) => {
              setDateRangeStart(start)
              setDateRangeEnd(end)
            }}
          />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Timeline
        projectId={projectId}
        filters={{
          categoryId: categoryFilter,
          contactId: contactFilter,
          startDate: dateRangeStart,
          endDate: dateRangeEnd,
        }}
      />

      {/* Mobile: Floating Action Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild className="sm:hidden">
          <Button size="lg" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Add a new milestone, meeting, or inspection to your project timeline
            </DialogDescription>
          </DialogHeader>
          <EventEntryForm
            projectId={projectId}
            onSuccess={handleEventCreated}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
