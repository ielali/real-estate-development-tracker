"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { CostEntryForm } from "@/components/costs/CostEntryForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { api } from "@/lib/trpc/client"

/**
 * Cost Entry Page
 *
 * Allows users to add new costs to a project.
 * Redirects back to project detail page on success.
 *
 * Route: /projects/[id]/costs/new
 */
export default function NewCostPage() {
  const params = useParams()
  if (!params) return null
  const projectId = params.id as string

  // Fetch project to get name for breadcrumb
  const { data: project } = api.projects.getById.useQuery({ id: projectId })

  const breadcrumbItems = [
    { label: "Projects", href: "/projects" },
    { label: project?.name || "...", href: `/projects/${projectId}` },
    { label: "Add Cost" },
  ]

  return (
    <>
      <Navbar />
      <div className="container max-w-2xl py-8">
        {/* Breadcrumb */}
        {project && (
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add Cost</CardTitle>
            <CardDescription>Record a new cost for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <CostEntryForm projectId={projectId} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
