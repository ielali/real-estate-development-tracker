"use client"

import Link from "next/link"
import { api } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { ProjectListSkeleton } from "@/components/skeletons/project-list-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"

/**
 * ProjectsListPage - Display all projects for the authenticated user
 *
 * Shows projects as cards with ability to create new projects
 * Includes loading and empty states
 */
export default function ProjectsListPage() {
  const { data: projects, isLoading, error } = api.projects.list.useQuery()

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container py-10">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbHelpers.projects()} />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-600 mt-2">Manage your real estate development projects</p>
          </div>
          <ProjectListSkeleton count={6} />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container py-10">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbHelpers.projects()} />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <ErrorState
            title="Failed to load projects"
            message="Unable to fetch project data. Please try again."
            action={<Button onClick={() => window.location.reload()}>Try Again</Button>}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container py-10">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbHelpers.projects()} />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your real estate development projects</p>
        </div>

        {projects && projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started tracking your real estate development"
            action={
              <Link href="/projects/new" as={"/projects/new" as never}>
                <Button>Create Project</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map(
              (
                project: any // eslint-disable-line @typescript-eslint/no-explicit-any
              ) => (
                <ProjectCard key={project.id} project={project as any} /> // eslint-disable-line @typescript-eslint/no-explicit-any
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}
