import { Suspense } from "react"
import { CostEditForm } from "@/components/costs/CostEditForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/Navbar"

interface PageProps {
  params: Promise<{
    id: string
    costId: string
  }>
}

/**
 * Cost Edit Page
 *
 * Allows users to edit existing costs.
 * Redirects back to project detail page on success.
 *
 * Route: /projects/[id]/costs/[costId]/edit
 */
export default async function EditCostPage({ params }: PageProps) {
  const { id: projectId, costId } = await params

  return (
    <>
      <Navbar />
      <div className="container max-w-2xl py-8">
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
      </div>
    </>
  )
}
