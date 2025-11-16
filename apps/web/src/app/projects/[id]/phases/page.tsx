"use client"

/**
 * Project Phases Management Page
 *
 * Allows users to:
 * - View all construction phases for a project
 * - Create, edit, and delete phases
 * - Update phase progress and status
 * - Initialize phases from templates (residential/commercial/renovation)
 * - Reorder phases
 */

import { useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, LayoutTemplate } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { PhaseEditModal } from "@/components/phases/PhaseEditModal"
import { PhaseTemplateModal } from "@/components/phases/PhaseTemplateModal"
import { getPhaseColor } from "@/lib/timeline-config"

export default function PhasesPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) ?? ""

  // State
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null)

  // Fetch project data for breadcrumb
  const { data: project, isLoading: projectLoading } = api.projects.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  )

  // Fetch phases
  const {
    data: phases,
    isLoading: phasesLoading,
    error: phasesError,
    refetch: refetchPhases,
  } = api.phases.getByProject.useQuery({ projectId }, { enabled: !!projectId })

  // Delete mutation
  const deleteMutation = api.phases.delete.useMutation({
    onSuccess: () => {
      toast.success("Phase deleted successfully")
      refetchPhases()
      setDeletingPhaseId(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete phase")
    },
  })

  // Handlers
  const handleEdit = (phaseId: string) => {
    setEditingPhase(phaseId)
  }

  const handleCreate = () => {
    setIsCreating(true)
  }

  const handleDelete = (phaseId: string) => {
    setDeletingPhaseId(phaseId)
  }

  const confirmDelete = () => {
    if (deletingPhaseId) {
      deleteMutation.mutate({ id: deletingPhaseId })
    }
  }

  const handleSaved = () => {
    refetchPhases()
    setEditingPhase(null)
    setIsCreating(false)
  }

  const handleTemplateApplied = () => {
    refetchPhases()
    setShowTemplateModal(false)
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge variant="default">Complete</Badge>
      case "in-progress":
        return (
          <Badge variant="default" className="bg-blue-500">
            In Progress
          </Badge>
        )
      case "planned":
        return <Badge variant="secondary">Planned</Badge>
      case "delayed":
        return <Badge variant="destructive">Delayed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Loading state
  if (projectLoading || phasesLoading) {
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

  const hasPhases = phases && phases.length > 0

  return (
    <div className="px-6 py-10 max-w-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbHelpers.projectPhases(project.name, projectId)} />
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Construction Phases</h1>
          <p className="text-muted-foreground">
            Manage construction phases, progress, and timelines for {project.name}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!hasPhases && (
            <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Phase
          </Button>
        </div>
      </div>

      {/* Error State */}
      {phasesError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">
            {phasesError.message || "Failed to load phases"}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!hasPhases && !phasesError && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Phases Yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating custom phases or using a template
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Use Template
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Phase
            </Button>
          </div>
        </div>
      )}

      {/* Phases Table */}
      {hasPhases && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Phase Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Planned Start</TableHead>
                <TableHead>Planned End</TableHead>
                <TableHead>Actual Start</TableHead>
                <TableHead>Actual End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phases.map((phase) => {
                const phaseColor = getPhaseColor(phase.phaseNumber)
                return (
                  <TableRow key={phase.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${phaseColor.marker}`}
                          aria-hidden="true"
                        />
                        {phase.phaseNumber}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{phase.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {phase.phaseType || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(phase.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[100px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {phase.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {phase.plannedStartDate
                        ? format(new Date(phase.plannedStartDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {phase.plannedEndDate
                        ? format(new Date(phase.plannedEndDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {phase.actualStartDate
                        ? format(new Date(phase.actualStartDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {phase.actualEndDate
                        ? format(new Date(phase.actualEndDate), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(phase.id)}
                          aria-label="Edit phase"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(phase.id)}
                          aria-label="Delete phase"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Phase Modal */}
      {editingPhase && (
        <PhaseEditModal
          phaseId={editingPhase}
          projectId={projectId}
          onClose={() => setEditingPhase(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Create Phase Modal */}
      {isCreating && (
        <PhaseEditModal
          projectId={projectId}
          onClose={() => setIsCreating(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <PhaseTemplateModal
          projectId={projectId}
          onClose={() => setShowTemplateModal(false)}
          onApplied={handleTemplateApplied}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPhaseId} onOpenChange={() => setDeletingPhaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Phase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this phase? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeletingPhaseId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
