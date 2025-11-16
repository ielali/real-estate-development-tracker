import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, asc } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { events } from "@/server/db/schema/events"
import { projects } from "@/server/db/schema/projects"
import { phases } from "@/server/db/schema/phases"
import { verifyProjectAccess } from "../helpers/verifyProjectAccess"
import { format } from "date-fns"
import type { Phase, Milestone, Timeline } from "@/lib/timeline-calculations"
import type { MilestoneStatus } from "@/lib/timeline-config"

/**
 * Timeline Router
 *
 * Provides timeline visualization data from database-backed phases and events:
 * - Phases from phases table (Foundation, Framing, MEP, etc.)
 * - Events with category "milestone" mapped to Milestone objects
 * - Events linked to phases via phaseId
 */

const getTimelineSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
})

export const timelineRouter = createTRPCRouter({
  /**
   * Get timeline data for a project
   *
   * Fetches phases and milestone events from database and transforms
   * into timeline visualization format.
   *
   * @throws {TRPCError} UNAUTHORIZED - User not authenticated
   * @throws {TRPCError} FORBIDDEN - User does not have access to project
   * @throws {TRPCError} NOT_FOUND - Project not found
   * @returns {Timeline} Timeline data with phases and milestones
   */
  getByProject: protectedProcedure
    .input(getTimelineSchema)
    .query(async ({ ctx, input }): Promise<Timeline> => {
      const userId = ctx.session.user.id

      // Verify project access
      await verifyProjectAccess(ctx.db, input.projectId, userId)

      // Get project details
      const [project] = await ctx.db
        .select({
          id: projects.id,
          name: projects.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
        })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1)

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        })
      }

      // Fetch phases from database (ordered by phase number)
      const projectPhases = await ctx.db
        .select()
        .from(phases)
        .where(eq(phases.projectId, input.projectId))
        .orderBy(asc(phases.phaseNumber))

      // Fetch milestone events (ordered by date)
      const milestoneEvents = await ctx.db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          date: events.date,
          phaseId: events.phaseId,
        })
        .from(events)
        .where(eq(events.projectId, input.projectId))
        .orderBy(asc(events.date))

      // Map all events to milestones (categoryId filtering removed - can be added back when category join is needed)
      const milestones = milestoneEvents.map(
        (event: (typeof milestoneEvents)[number]): Milestone => {
          const eventDate = new Date(event.date)
          const today = new Date()

          // Determine milestone status based on date
          let milestoneStatus: MilestoneStatus
          if (eventDate < today) {
            milestoneStatus = "complete"
          } else {
            // Check if belongs to in-progress or upcoming phase
            const belongsToPhase = projectPhases.find(
              (p: (typeof projectPhases)[number]) => p.id === event.phaseId
            )
            if (belongsToPhase) {
              milestoneStatus =
                belongsToPhase.status === "in-progress" || belongsToPhase.status === "upcoming"
                  ? "upcoming"
                  : "planned"
            } else {
              milestoneStatus = "planned"
            }
          }

          return {
            id: event.id,
            name: event.title,
            date: format(eventDate, "yyyy-MM-dd"),
            phaseId: event.phaseId || projectPhases[0]?.id || "",
            status: milestoneStatus,
            icon:
              milestoneStatus === "complete"
                ? "checkmark"
                : milestoneStatus === "upcoming"
                  ? "clock"
                  : "clipboard",
            description: event.description || undefined,
          }
        }
      )

      // Map database phases to timeline Phase format
      const timelinePhases: Phase[] = projectPhases.map(
        (phase: (typeof projectPhases)[number]) => ({
          id: phase.id,
          name: phase.name,
          phaseNumber: phase.phaseNumber,
          startDate: phase.plannedStartDate
            ? format(phase.plannedStartDate, "yyyy-MM-dd")
            : phase.actualStartDate
              ? format(phase.actualStartDate, "yyyy-MM-dd")
              : format(project.startDate || new Date(), "yyyy-MM-dd"),
          endDate: phase.plannedEndDate
            ? format(phase.plannedEndDate, "yyyy-MM-dd")
            : phase.actualEndDate
              ? format(phase.actualEndDate, "yyyy-MM-dd")
              : format(project.endDate || new Date(), "yyyy-MM-dd"),
          progress: phase.progress,
          status: phase.status as "complete" | "in-progress" | "upcoming" | "planned",
        })
      )

      // Calculate project date range from phases or use project dates
      let projectStartDate: string
      let projectEndDate: string

      if (timelinePhases.length > 0) {
        projectStartDate = timelinePhases[0].startDate
        projectEndDate = timelinePhases[timelinePhases.length - 1].endDate
      } else {
        // Fallback to project dates if no phases exist
        projectStartDate = project.startDate
          ? format(project.startDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
        projectEndDate = project.endDate
          ? format(project.endDate, "yyyy-MM-dd")
          : format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") // +6 months
      }

      // Return timeline data
      return {
        project: {
          id: project.id,
          name: project.name,
          startDate: projectStartDate,
          endDate: projectEndDate,
        },
        phases: timelinePhases,
        milestones,
      }
    }),
})
