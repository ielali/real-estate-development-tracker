import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ProjectListSkeletonProps {
  count?: number
}

/**
 * ProjectListSkeleton - Loading skeleton for project list
 *
 * Displays placeholder cards while projects are loading
 */
export function ProjectListSkeleton({ count = 4 }: ProjectListSkeletonProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
