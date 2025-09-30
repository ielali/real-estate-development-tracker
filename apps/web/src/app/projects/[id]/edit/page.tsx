"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/trpc/client"
import { Navbar } from "@/components/layout/Navbar"
import { ProjectEditForm } from "@/components/projects/ProjectEditForm"

/**
 * ProjectEditPage - Page for editing an existing project
 *
 * Loads project data and displays edit form
 */
export default function ProjectEditPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { data: project, isLoading, error } = api.projects.getById.useQuery({ id: projectId })

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container max-w-2xl py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    )
  }

  if (error || !project) {
    return (
      <>
        <Navbar />
        <div className="container max-w-2xl py-10">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load project</p>
            <button onClick={() => router.back()} className="text-blue-600 hover:underline">
              Go Back
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container max-w-2xl py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/projects/${project.id}` as never} className="text-blue-600 hover:underline">
            ← Back to Project
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-gray-600 mt-2">Update your project information</p>
        </div>

        <ProjectEditForm project={project} />
      </div>
    </>
  )
}
