"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookmarkPlus, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

export interface CostTemplate {
  id: string
  name: string
  description: string
  categoryId: string
  contactId?: string | null
  createdAt: number
}

interface CostTemplatesProps {
  projectId: string
  /**
   * Callback when a template is selected
   */
  onApplyTemplate: (template: Omit<CostTemplate, "id" | "name" | "createdAt">) => void
  /**
   * Current form values to save as template
   */
  currentValues?: {
    description: string
    categoryId?: string
    contactId?: string | null
  }
}

/**
 * CostTemplates - Manage and apply cost templates for quick entry
 *
 * Features:
 * - Save current form as template
 * - Apply saved templates to form
 * - Delete templates
 * - Templates stored in localStorage per project
 */
export function CostTemplates({ projectId, onApplyTemplate, currentValues }: CostTemplatesProps) {
  const [templates, setTemplates] = React.useState<CostTemplate[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [templateName, setTemplateName] = React.useState("")

  const storageKey = `cost-templates-${projectId}`

  // Load templates from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setTemplates(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse templates:", error)
      }
    }
  }, [storageKey])

  // Save templates to localStorage whenever they change
  const saveTemplates = (newTemplates: CostTemplate[]) => {
    setTemplates(newTemplates)
    localStorage.setItem(storageKey, JSON.stringify(newTemplates))
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    if (!currentValues?.description || !currentValues?.categoryId) {
      toast.error("Please fill in description and category before saving template")
      return
    }

    const newTemplate: CostTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      description: currentValues.description,
      categoryId: currentValues.categoryId,
      contactId: currentValues.contactId,
      createdAt: Date.now(),
    }

    saveTemplates([...templates, newTemplate])
    setTemplateName("")
    setIsDialogOpen(false)
    toast.success("Template saved successfully")
  }

  const handleApplyTemplate = (template: CostTemplate) => {
    onApplyTemplate({
      description: template.description,
      categoryId: template.categoryId,
      contactId: template.contactId,
    })
    toast.success(`Applied template: ${template.name}`)
  }

  const handleDeleteTemplate = (templateId: string) => {
    const updated = templates.filter((t) => t.id !== templateId)
    saveTemplates(updated)
    toast.success("Template deleted")
  }

  return (
    <div className="flex gap-2">
      {/* Apply Template Dropdown */}
      {templates.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Templates ({templates.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Cost Templates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-accent"
              >
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(template)}
                  className="flex-1 text-left text-sm"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {template.description}
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTemplate(template.id)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Save as Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Cost Template</DialogTitle>
            <DialogDescription>
              Save the current cost details as a template for quick reuse
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Weekly Labor Cost"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTemplate()
                  }
                }}
              />
            </div>
            {currentValues && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium mb-1">Template will include:</div>
                <div className="text-muted-foreground">
                  <div>Description: {currentValues.description || "(empty)"}</div>
                  <div>Category: {currentValues.categoryId ? "Selected" : "(empty)"}</div>
                  {currentValues.contactId && <div>Contact: Linked</div>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setTemplateName("")
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
