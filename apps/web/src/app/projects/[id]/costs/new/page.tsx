import { Suspense } from "react"
import { CostEntryForm } from "@/components/costs/CostEntryForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Cost Entry Page
 *
 * Allows users to add new costs to a project.
 * Redirects back to project detail page on success.
 *
 * Route: /projects/[id]/costs/new
 */
export default async function NewCostPage({ params }: PageProps) {
  const { id: projectId } = await params

  return (
    <>
      <Navbar />
      <div className="container max-w-2xl py-8">
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
