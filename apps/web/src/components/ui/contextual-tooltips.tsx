"use client"

import { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { HelpCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Contextual tooltips that provide helpful guidance
 * Used throughout the app to explain features and fields
 */

interface HelpTooltipProps {
  content: ReactNode
  children?: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function HelpTooltip({ content, children, side = "top", className }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
                className
              )}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function InfoTooltip({ content, children, side = "top", className }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
                className
              )}
            >
              <Info className="h-4 w-4" />
              <span className="sr-only">Information</span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface FieldTooltipProps {
  label: string
  description: string
  children: ReactNode
  required?: boolean
  side?: "top" | "right" | "bottom" | "left"
}

export function FieldTooltip({
  label,
  description,
  children,
  required,
  side = "top",
}: FieldTooltipProps) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <HelpTooltip content={description} side={side} />
      <div className="sr-only">{children}</div>
    </div>
  )
}

/**
 * Pre-built contextual tooltips for common fields
 */

export const tooltips = {
  // Project fields
  projectName: (
    <div>
      <p className="font-medium">Project Name</p>
      <p className="text-xs mt-1">
        A unique identifier for your project. This will appear in lists and reports.
      </p>
    </div>
  ),

  projectAddress: (
    <div>
      <p className="font-medium">Project Address</p>
      <p className="text-xs mt-1">
        The physical location of the property. Used for mapping and location-based features.
      </p>
    </div>
  ),

  projectBudget: (
    <div>
      <p className="font-medium">Budget</p>
      <p className="text-xs mt-1">
        Total planned budget for the project. Used to track spending and generate budget reports.
      </p>
    </div>
  ),

  // Cost fields
  costAmount: (
    <div>
      <p className="font-medium">Cost Amount</p>
      <p className="text-xs mt-1">
        Enter the amount in dollars. This will be tracked against your project budget.
      </p>
    </div>
  ),

  costCategory: (
    <div>
      <p className="font-medium">Category</p>
      <p className="text-xs mt-1">
        Categorize this cost for better reporting and budget tracking. Create custom categories in
        settings.
      </p>
    </div>
  ),

  costDate: (
    <div>
      <p className="font-medium">Cost Date</p>
      <p className="text-xs mt-1">The date this cost was incurred or is expected to be paid.</p>
    </div>
  ),

  costTemplate: (
    <div>
      <p className="font-medium">Cost Template</p>
      <p className="text-xs mt-1">
        Save this cost as a template to quickly add similar expenses in the future.
      </p>
    </div>
  ),

  // Document fields
  documentType: (
    <div>
      <p className="font-medium">Document Type</p>
      <p className="text-xs mt-1">
        Select the type of document you're uploading (e.g., Contract, Permit, Invoice).
      </p>
    </div>
  ),

  documentTags: (
    <div>
      <p className="font-medium">Tags</p>
      <p className="text-xs mt-1">
        Add tags to make documents easier to find. Press Enter to add a tag.
      </p>
    </div>
  ),

  // Contact fields
  contactRole: (
    <div>
      <p className="font-medium">Role</p>
      <p className="text-xs mt-1">
        The contact's role in the project (e.g., Contractor, Architect, Vendor).
      </p>
    </div>
  ),

  contactCompany: (
    <div>
      <p className="font-medium">Company</p>
      <p className="text-xs mt-1">The company or organization this contact represents.</p>
    </div>
  ),

  // Event fields
  eventType: (
    <div>
      <p className="font-medium">Event Type</p>
      <p className="text-xs mt-1">
        Select whether this is a meeting, inspection, milestone, or other event type.
      </p>
    </div>
  ),

  eventReminder: (
    <div>
      <p className="font-medium">Reminder</p>
      <p className="text-xs mt-1">Get notified before the event. You can set multiple reminders.</p>
    </div>
  ),

  // Sharing & permissions
  projectAccess: (
    <div>
      <p className="font-medium">Project Access</p>
      <p className="text-xs mt-1">
        Control who can view and edit this project:
        <br />• <strong>Owner:</strong> Full control
        <br />• <strong>Editor:</strong> Can modify data
        <br />• <strong>Viewer:</strong> Read-only access
      </p>
    </div>
  ),

  inviteEmail: (
    <div>
      <p className="font-medium">Email Invitation</p>
      <p className="text-xs mt-1">
        Send an email invitation to collaborate on this project. They'll need to create an account
        if they don't have one.
      </p>
    </div>
  ),

  // Advanced features
  softDelete: (
    <div>
      <p className="font-medium">Soft Delete</p>
      <p className="text-xs mt-1">
        Deleted items are hidden but not permanently removed. You can restore them from the archive.
      </p>
    </div>
  ),

  exportData: (
    <div>
      <p className="font-medium">Export Data</p>
      <p className="text-xs mt-1">
        Download your data in CSV or PDF format for reporting and backup purposes.
      </p>
    </div>
  ),

  bulkActions: (
    <div>
      <p className="font-medium">Bulk Actions</p>
      <p className="text-xs mt-1">
        Select multiple items to perform actions like delete, categorize, or export at once.
      </p>
    </div>
  ),
}
