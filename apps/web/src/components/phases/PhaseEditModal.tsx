"use client"

/**
 * Phase Edit Modal Component
 *
 * Modal dialog for creating or editing a construction phase.
 * Handles all phase properties including dates, progress, and status.
 */

import { useState, useEffect } from "react"
import { api } from "@/lib/trpc/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"

interface PhaseEditModalProps {
  phaseId?: string // If undefined, creating new phase
  projectId: string
  onClose: () => void
  onSaved: () => void
}

export function PhaseEditModal({ phaseId, projectId, onClose, onSaved }: PhaseEditModalProps) {
  const isEditing = !!phaseId

  // Form state
  const [name, setName] = useState("")
  const [phaseNumber, setPhaseNumber] = useState(1)
  const [phaseType, setPhaseType] = useState("")
  const [status, setStatus] = useState<"planned" | "in-progress" | "complete" | "delayed">(
    "planned"
  )
  const [progress, setProgress] = useState(0)
  const [plannedStartDate, setPlannedStartDate] = useState("")
  const [plannedEndDate, setPlannedEndDate] = useState("")
  const [actualStartDate, setActualStartDate] = useState("")
  const [actualEndDate, setActualEndDate] = useState("")
  const [description, setDescription] = useState("")

  // Fetch existing phase data if editing
  const { data: phases } = api.phases.getByProject.useQuery({ projectId }, { enabled: !!projectId })

  const existingPhase = phases?.find((p) => p.id === phaseId)

  // Populate form when editing
  useEffect(() => {
    if (existingPhase) {
      setName(existingPhase.name)
      setPhaseNumber(existingPhase.phaseNumber)
      setPhaseType(existingPhase.phaseType || "")
      setStatus(existingPhase.status as typeof status)
      setProgress(existingPhase.progress)
      setPlannedStartDate(
        existingPhase.plannedStartDate
          ? new Date(existingPhase.plannedStartDate).toISOString().split("T")[0]
          : ""
      )
      setPlannedEndDate(
        existingPhase.plannedEndDate
          ? new Date(existingPhase.plannedEndDate).toISOString().split("T")[0]
          : ""
      )
      setActualStartDate(
        existingPhase.actualStartDate
          ? new Date(existingPhase.actualStartDate).toISOString().split("T")[0]
          : ""
      )
      setActualEndDate(
        existingPhase.actualEndDate
          ? new Date(existingPhase.actualEndDate).toISOString().split("T")[0]
          : ""
      )
      setDescription(existingPhase.description || "")
    } else if (phases) {
      // Auto-increment phase number for new phases
      const maxPhaseNumber = phases.reduce((max, p) => Math.max(max, p.phaseNumber), 0)
      setPhaseNumber(maxPhaseNumber + 1)
    }
  }, [existingPhase, phases])

  // Create mutation
  const createMutation = api.phases.create.useMutation({
    onSuccess: () => {
      toast.success("Phase created successfully")
      onSaved()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create phase")
    },
  })

  // Update mutation
  const updateMutation = api.phases.update.useMutation({
    onSuccess: () => {
      toast.success("Phase updated successfully")
      onSaved()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update phase")
    },
  })

  // Handle save
  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Phase name is required")
      return
    }

    if (isEditing && phaseId) {
      updateMutation.mutate({
        id: phaseId,
        name: name.trim(),
        phaseNumber,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : undefined,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : undefined,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : undefined,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : undefined,
        progress,
        status,
        description: description.trim() || undefined,
      })
    } else {
      createMutation.mutate({
        projectId,
        name: name.trim(),
        phaseNumber,
        phaseType: phaseType.trim() || undefined,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : undefined,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : undefined,
        description: description.trim() || undefined,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Phase" : "Create New Phase"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update phase details, dates, and progress"
              : "Add a new construction phase to your project"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Name & Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Phase Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Foundation, Framing, MEP"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseNumber">Phase Number *</Label>
              <Input
                id="phaseNumber"
                type="number"
                min="1"
                value={phaseNumber}
                onChange={(e) => setPhaseNumber(parseInt(e.target.value) || 1)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Phase Type */}
          <div className="space-y-2">
            <Label htmlFor="phaseType">Phase Type (Optional)</Label>
            <Input
              id="phaseType"
              value={phaseType}
              onChange={(e) => setPhaseType(e.target.value)}
              placeholder="e.g., foundation, framing, mep_rough"
              disabled={isPending}
            />
          </div>

          {/* Status & Progress (only when editing) */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress: {progress}%</Label>
                <Slider
                  id="progress"
                  value={[progress]}
                  onValueChange={(v) => setProgress(v[0] ?? 0)}
                  max={100}
                  step={5}
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          {/* Planned Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedStartDate">Planned Start Date</Label>
              <Input
                id="plannedStartDate"
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedEndDate">Planned End Date</Label>
              <Input
                id="plannedEndDate"
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Actual Dates (only when editing) */}
          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actualStartDate">Actual Start Date</Label>
                <Input
                  id="actualStartDate"
                  type="date"
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualEndDate">Actual End Date</Label>
                <Input
                  id="actualEndDate"
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this phase..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update Phase" : "Create Phase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
