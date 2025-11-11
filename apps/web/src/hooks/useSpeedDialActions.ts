/**
 * useSpeedDialActions Hook
 * Story 10.7: Floating Action Button with Speed Dial
 *
 * Handles speed dial option actions and routing
 */

"use client"

import { useRouter, usePathname } from "next/navigation"
import { useToast } from "./use-toast"
import type { SpeedDialOption } from "@/types/speed-dial"

/**
 * Hook to handle speed dial actions
 *
 * Routes to existing create workflows or opens modals
 * based on the selected option and current context.
 */
export function useSpeedDialActions() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  /**
   * Extract project ID from current path if available
   * Matches patterns like /projects/[id]/...
   */
  const getProjectIdFromPath = (): string | null => {
    const match = pathname?.match(/\/projects\/([a-zA-Z0-9-]+)/)
    return match ? match[1] : null
  }

  /**
   * Handle speed dial option selection
   *
   * @param option - Selected speed dial option
   */
  const handleAction = async (option: SpeedDialOption) => {
    const projectId = getProjectIdFromPath()

    switch (option.action) {
      case "capture-photo":
        // Photo capture - navigate to document upload with camera intent
        if (projectId) {
          // Navigate to project documents page where FileUpload component can handle camera
          router.push(`/projects/${projectId}/documents`)
          toast({
            title: "Photo Capture",
            description: "Use the upload button to capture a photo from your camera.",
          })
        } else {
          toast({
            title: "Select Project",
            description: "Please select a project first to upload photos.",
          })
          router.push("/projects")
        }
        break

      case "add-cost":
        // Navigate to cost entry
        if (projectId) {
          router.push(`/projects/${projectId}/costs/new`)
        } else {
          toast({
            title: "Select Project",
            description: "Please select a project first to add costs.",
          })
          router.push("/projects")
        }
        break

      case "add-task":
        // Navigate to task/event creation
        if (projectId) {
          // For now, navigate to project detail where events can be added
          router.push(`/projects/${projectId}`)
          toast({
            title: "Add Task/Event",
            description: "Use the Events section to add a task or milestone.",
          })
        } else {
          toast({
            title: "Select Project",
            description: "Please select a project first to add tasks.",
          })
          router.push("/projects")
        }
        break

      case "upload-document":
        // Navigate to document upload
        if (projectId) {
          router.push(`/projects/${projectId}/documents`)
        } else {
          toast({
            title: "Select Project",
            description: "Please select a project first to upload documents.",
          })
          router.push("/projects")
        }
        break

      case "add-note":
        // Navigate to project detail where comments/notes can be added
        if (projectId) {
          router.push(`/projects/${projectId}`)
          toast({
            title: "Add Note",
            description: "Use the Comments section to add a note about this project.",
          })
        } else {
          toast({
            title: "Select Project",
            description: "Please select a project first to add notes.",
          })
          router.push("/projects")
        }
        break

      default:
        toast({
          title: "Action not implemented",
          description: `The action "${option.action}" is not yet available.`,
          variant: "destructive",
        })
    }
  }

  return { handleAction }
}
