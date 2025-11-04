"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { CostEditForm } from "@/components/costs/CostEditForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { api } from "@/lib/trpc/client"
import { CommentThread } from "@/components/comments/CommentThread"

/**
 * Cost Edit Page
 *
 * Allows users to edit existing costs.
 * Redirects back to project detail page on success.
 *
 * Route: /projects/[id]/costs/[costId]/edit
 */
export default function EditCostPage() {
  const params = useParams()
  const projectId = params.id as string
  const costId = params.costId as string

  // Fetch project for breadcrumb
  const { data: project } = api.projects.getById.useQuery({ id: projectId })

  const breadcrumbItems = [
    { label: "Projects", href: "/projects" },
    { label: project?.name || "...", href: `/projects/${projectId}` },
    { label: "Edit Cost" },
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
            <CardTitle>Edit Cost</CardTitle>
            <CardDescription>Update cost details</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <CostEditForm projectId={projectId} costId={costId} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {project && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <CommentThread
                entityType="cost"
                entityId={costId}
                projectId={projectId}
                projectOwnerId={project.ownerId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
