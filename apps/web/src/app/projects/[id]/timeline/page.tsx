"use client"

/**
 * Project Timeline Page
 *
 * Displays visual Gantt-style timeline for a project showing:
 * - Project phases with progress
 * - Milestones with dates
 * - Today indicator
 * - Timeline controls and filters
 * - Responsive layout (Gantt on desktop, vertical cards on mobile)
 */

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TimelineControls } from "@/components/timeline/TimelineControls"
import { TimelineActions } from "@/components/timeline/TimelineActions"
import { TimelineGrid } from "@/components/timeline/TimelineGrid"
import { VerticalTimeline } from "@/components/timeline/VerticalTimeline"
import { EventEntryForm } from "@/components/events"
import { calculateProjectProgress } from "@/lib/timeline-calculations"
import { filterPhases, filterMilestones, getDefaultFilters } from "@/lib/timeline-utils"
import type { TimelineView, TimelineFilters } from "@/lib/timeline-utils"

export default function TimelinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) ?? ""

  // Fetch project data for breadcrumb and header
  const { data: project, isLoading: projectLoading } = api.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  )

  // Fetch timeline data (phases and milestones)
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = api.timeline.getByProject.useQuery({ projectId }, { enabled: !!projectId })

  // State
  const [view, setView] = useState<TimelineView>("monthly")
  const [filters, setFilters] = useState<TimelineFilters>(getDefaultFilters())
  const [isMobile, setIsMobile] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Filter timeline based on filters
  const filteredTimeline = useMemo(() => {
    if (!timeline) return null

    const visiblePhases = filterPhases(timeline.phases, filters)
    const visibleMilestones = filterMilestones(timeline.milestones, visiblePhases)

    return {
      ...timeline,
      phases: visiblePhases,
      milestones: visibleMilestones,
    }
  }, [timeline, filters])

  // Calculate overall progress
  const overallProgress = useMemo(
    () => calculateProjectProgress(timeline?.phases || []),
    [timeline?.phases]
  )

  // Handlers
  const handlePhaseClick = (phase: NonNullable<typeof timeline>["phases"][0]) => {
    console.log("Phase clicked:", phase)
    // TODO: Navigate to phase details or open modal
  }

  const handleMilestoneClick = (milestone: NonNullable<typeof timeline>["milestones"][0]) => {
    console.log("Milestone clicked:", milestone)
    // TODO: Navigate to milestone details or open modal
  }

  const handleAddEvent = () => {
    setEventDialogOpen(true)
  }

  const handleEventCreated = () => {
    setEventDialogOpen(false)
  }

  // Loading state
  if (projectLoading || timelineLoading) {
    return (
      <div className="px-6 py-10 max-w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (!project) {
    return (
      <div className="px-6 py-10 max-w-full">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">Project not found</p>
          <Button onClick={() => router.push("/projects" as never)}>Back to Projects</Button>
        </div>
      </div>
    )
  }

  // Timeline error state
  if (timelineError || !timeline) {
    return (
      <div className="px-6 py-10 max-w-full">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbHelpers.projectTimeline(project.name, projectId)} />
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {timelineError?.message || "Failed to load timeline data"}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Empty timeline state
  if (!filteredTimeline) {
    return (
      <div className="px-6 py-10 max-w-full">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbHelpers.projectTimeline(project.name, projectId)} />
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No timeline data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-10 max-w-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbHelpers.projectTimeline(project.name, projectId)} />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Project Timeline</h1>
          <p className="text-muted-foreground">
            Visual Gantt-style timeline showing phases, milestones, and progress for {project.name}
          </p>
        </div>

        {/* Timeline Actions */}
        <TimelineActions
          view={view}
          onViewChange={setView}
          filters={filters}
          onFiltersChange={setFilters}
          onAddEvent={handleAddEvent}
          projectId={projectId}
        />
      </div>

      {/* Timeline Controls */}
      <div className="mb-6">
        <TimelineControls project={filteredTimeline.project} progress={overallProgress} />
      </div>

      {/* Timeline Visualization */}
      {isMobile ? (
        // Mobile: Vertical Timeline
        <VerticalTimeline
          timeline={filteredTimeline}
          onPhaseClick={handlePhaseClick}
          onMilestoneClick={handleMilestoneClick}
        />
      ) : (
        // Desktop: Gantt Timeline
        <TimelineGrid
          timeline={filteredTimeline}
          view={view}
          onPhaseClick={handlePhaseClick}
          onMilestoneClick={handleMilestoneClick}
        />
      )}

      {/* Add Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new milestone, meeting, or inspection for this project
            </DialogDescription>
          </DialogHeader>
          <EventEntryForm projectId={projectId} onEventCreated={handleEventCreated} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
