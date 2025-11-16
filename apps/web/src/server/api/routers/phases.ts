import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, asc } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { phases } from "@/server/db/schema/phases"
import { verifyProjectAccess } from "../helpers/verifyProjectAccess"
import { getPhaseTemplate, type ProjectType } from "@/lib/construction-phases"

/**
 * Phases Router
 *
 * Manages construction phases for projects including:
 * - Phase initialization from templates
 * - CRUD operations for phases
 * - Progress tracking
 * - Phase-based timeline data
 */

const projectTypeSchema = z.enum(["residential", "commercial", "renovation"])

const createPhaseSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  phaseNumber: z.number().int().positive(),
  phaseType: z.string().max(100).optional(),
  plannedStartDate: z.date().optional(),
  plannedEndDate: z.date().optional(),
  description: z.string().optional(),
})

const updatePhaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  phaseNumber: z.number().int().positive().optional(),
  plannedStartDate: z.date().optional(),
  plannedEndDate: z.date().optional(),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["planned", "in-progress", "complete", "delayed"]).optional(),
  description: z.string().optional(),
})

export const phasesRouter = createTRPCRouter({
  /**
   * Get all phases for a project
   */
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project access
      await verifyProjectAccess(ctx.db, input.projectId, userId)

      // Fetch phases ordered by phase number
      const projectPhases = await ctx.db
        .select()
        .from(phases)
        .where(eq(phases.projectId, input.projectId))
        .orderBy(asc(phases.phaseNumber))

      return projectPhases
    }),

  /**
   * Initialize phases from template
   */
  initializeFromTemplate: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        templateType: projectTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project access
      await verifyProjectAccess(ctx.db, input.projectId, userId)

      // Check if phases already exist
      const existingPhases = await ctx.db
        .select()
        .from(phases)
        .where(eq(phases.projectId, input.projectId))
        .limit(1)

      if (existingPhases.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Project already has phases. Delete existing phases before initializing from template.",
        })
      }

      // Get template
      const template = getPhaseTemplate(input.templateType as ProjectType)

      // Create phases from template
      const newPhases = await ctx.db
        .insert(phases)
        .values(
          template.map((p) => ({
            projectId: input.projectId,
            name: p.name,
            phaseNumber: p.phaseNumber,
            phaseType: p.phaseType,
            description: p.description || null,
            status: "planned" as const,
            progress: 0,
          }))
        )
        .returning()

      return newPhases
    }),

  /**
   * Create a custom phase
   */
  create: protectedProcedure.input(createPhaseSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    // Verify project access
    await verifyProjectAccess(ctx.db, input.projectId, userId)

    // Create phase
    const [newPhase] = await ctx.db
      .insert(phases)
      .values({
        projectId: input.projectId,
        name: input.name,
        phaseNumber: input.phaseNumber,
        phaseType: input.phaseType || null,
        plannedStartDate: input.plannedStartDate || null,
        plannedEndDate: input.plannedEndDate || null,
        description: input.description || null,
        status: "planned",
        progress: 0,
      })
      .returning()

    return newPhase
  }),

  /**
   * Update phase
   */
  update: protectedProcedure.input(updatePhaseSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id
    const { id, ...updates } = input

    // Get phase to verify project access
    const [phase] = await ctx.db.select().from(phases).where(eq(phases.id, id)).limit(1)

    if (!phase) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Phase not found",
      })
    }

    // Verify project access
    await verifyProjectAccess(ctx.db, phase.projectId, userId)

    // Update phase
    const [updatedPhase] = await ctx.db
      .update(phases)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(phases.id, id))
      .returning()

    return updatedPhase
  }),

  /**
   * Update phase progress
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        progress: z.number().int().min(0).max(100),
        status: z.enum(["planned", "in-progress", "complete", "delayed"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get phase to verify project access
      const [phase] = await ctx.db.select().from(phases).where(eq(phases.id, input.id)).limit(1)

      if (!phase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Phase not found",
        })
      }

      // Verify project access
      await verifyProjectAccess(ctx.db, phase.projectId, userId)

      // Auto-update status based on progress if not explicitly provided
      let status = input.status
      if (!status) {
        if (input.progress === 0) {
          status = "planned"
        } else if (input.progress === 100) {
          status = "complete"
        } else {
          status = "in-progress"
        }
      }

      // Update phase
      const [updatedPhase] = await ctx.db
        .update(phases)
        .set({
          progress: input.progress,
          status,
          updatedAt: new Date(),
        })
        .where(eq(phases.id, input.id))
        .returning()

      return updatedPhase
    }),

  /**
   * Delete phase
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get phase to verify project access
      const [phase] = await ctx.db.select().from(phases).where(eq(phases.id, input.id)).limit(1)

      if (!phase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Phase not found",
        })
      }

      // Verify project access
      await verifyProjectAccess(ctx.db, phase.projectId, userId)

      // Delete phase
      await ctx.db.delete(phases).where(eq(phases.id, input.id))

      return { success: true }
    }),

  /**
   * Reorder phases (update phase numbers)
   */
  reorder: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        phaseIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Verify project access
      await verifyProjectAccess(ctx.db, input.projectId, userId)

      // Update phase numbers based on array order
      const updatePromises = input.phaseIds.map((phaseId, index) =>
        ctx.db
          .update(phases)
          .set({
            phaseNumber: index + 1,
            updatedAt: new Date(),
          })
          .where(and(eq(phases.id, phaseId), eq(phases.projectId, input.projectId)))
      )

      await Promise.all(updatePromises)

      // Return updated phases
      return await ctx.db
        .select()
        .from(phases)
        .where(eq(phases.projectId, input.projectId))
        .orderBy(asc(phases.phaseNumber))
    }),
})
