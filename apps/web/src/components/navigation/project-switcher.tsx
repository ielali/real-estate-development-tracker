"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Folder, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Project switcher dropdown component
 * Allows quick navigation between projects with search functionality
 */

export interface ProjectSwitcherProject {
  id: string
  name: string
  address?: string
}

interface ProjectSwitcherProps {
  currentProjectId?: string
  projects: ProjectSwitcherProject[]
  onProjectChange?: (projectId: string) => void
  className?: string
}

export function ProjectSwitcher({
  currentProjectId,
  projects,
  onProjectChange,
  className,
}: ProjectSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const currentProject = projects.find((p) => p.id === currentProjectId)

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProjectSelect = (projectId: string) => {
    setOpen(false)
    setSearchQuery("")
    if (onProjectChange) {
      onProjectChange(projectId)
    } else {
      router.push(`/projects/${projectId}`)
    }
  }

  const handleNewProject = () => {
    setOpen(false)
    router.push("/projects/new")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[240px] justify-between", className)}
        >
          <div className="flex items-center space-x-2 truncate">
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentProject ? currentProject.name : "Select project..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px] p-0" align="start">
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center space-x-2 px-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No projects found
            </div>
          ) : (
            filteredProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onSelect={() => handleProjectSelect(project.id)}
                className="flex items-center justify-between px-2"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{project.name}</span>
                  {project.address && (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {project.address}
                    </span>
                  )}
                </div>
                {currentProjectId === project.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleNewProject} className="px-2">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create new project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact version for mobile/smaller screens
 */
export function ProjectSwitcherCompact({
  currentProjectId,
  projects,
  onProjectChange,
  className,
}: ProjectSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const currentProject = projects.find((p) => p.id === currentProjectId)

  const handleProjectSelect = (projectId: string) => {
    setOpen(false)
    if (onProjectChange) {
      onProjectChange(projectId)
    } else {
      router.push(`/projects/${projectId}`)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Folder className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{currentProject?.name || "Projects"}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => handleProjectSelect(project.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{project.name}</span>
            {currentProjectId === project.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/projects/new")}>
          <Plus className="mr-2 h-4 w-4" />
          <span>New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
