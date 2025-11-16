"use client"

/**
 * Phase Template Modal Component
 *
 * Modal for initializing project phases from predefined templates:
 * - Residential (10 phases)
 * - Commercial (8 phases)
 * - Renovation (6 phases)
 */

import { useState } from "react"
import { api } from "@/lib/trpc/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RESIDENTIAL_PHASES, COMMERCIAL_PHASES, RENOVATION_PHASES } from "@/lib/construction-phases"
import { toast } from "sonner"
import { Building2, Home, Hammer } from "lucide-react"

interface PhaseTemplateModalProps {
  projectId: string
  onClose: () => void
  onApplied: () => void
}

type TemplateType = "residential" | "commercial" | "renovation"

const TEMPLATES = {
  residential: {
    label: "Residential",
    description: "Single-family and multi-family residential projects",
    icon: Home,
    phaseCount: RESIDENTIAL_PHASES.length,
    phases: RESIDENTIAL_PHASES,
  },
  commercial: {
    label: "Commercial",
    description: "Offices, retail, and industrial buildings",
    icon: Building2,
    phaseCount: COMMERCIAL_PHASES.length,
    phases: COMMERCIAL_PHASES,
  },
  renovation: {
    label: "Renovation",
    description: "Remodel and renovation projects",
    icon: Hammer,
    phaseCount: RENOVATION_PHASES.length,
    phases: RENOVATION_PHASES,
  },
}

export function PhaseTemplateModal({ projectId, onClose, onApplied }: PhaseTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("residential")

  // Initialize from template mutation
  const initializeMutation = api.phases.initializeFromTemplate.useMutation({
    onSuccess: () => {
      toast.success("Phases initialized successfully")
      onApplied()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initialize phases")
    },
  })

  const handleApply = () => {
    initializeMutation.mutate({
      projectId,
      templateType: selectedTemplate,
    })
  }

  const selectedTemplateData = TEMPLATES[selectedTemplate]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initialize Phases from Template</DialogTitle>
          <DialogDescription>
            Choose a template to quickly set up construction phases for your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selection */}
          <RadioGroup
            value={selectedTemplate}
            onValueChange={(v) => setSelectedTemplate(v as TemplateType)}
          >
            <div className="grid gap-4">
              {Object.entries(TEMPLATES).map(([key, template]) => {
                const Icon = template.icon
                const isSelected = selectedTemplate === key
                return (
                  <div
                    key={key}
                    className={`relative flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedTemplate(key as TemplateType)}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={key}
                        className="flex items-center gap-2 text-base font-semibold cursor-pointer"
                      >
                        <Icon className="w-5 h-5" />
                        {template.label}
                        <span className="text-sm text-muted-foreground font-normal">
                          ({template.phaseCount} phases)
                        </span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </RadioGroup>

          {/* Template Preview */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <selectedTemplateData.icon className="w-4 h-4" />
              {selectedTemplateData.label} Template Preview
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedTemplateData.phases.map((phase) => (
                <div
                  key={phase.phaseNumber}
                  className="flex items-start gap-3 p-2 rounded bg-background"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                    {phase.phaseNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{phase.name}</div>
                    {phase.description && (
                      <div className="text-sm text-muted-foreground">{phase.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> This will create {selectedTemplateData.phaseCount} phases with
              standard names and descriptions. You can customize dates, progress, and other details
              after initialization.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={initializeMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={initializeMutation.isPending}>
            {initializeMutation.isPending ? "Initializing..." : "Apply Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
