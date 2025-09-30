import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Address {
  id: string
  streetNumber: string | null
  streetName: string | null
  streetType: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  country: string | null
  formattedAddress: string | null
}

interface Project {
  id: string
  name: string
  projectType: string
  status: string
  startDate: Date | null
  address: Address | null
}

interface ProjectCardProps {
  project: Project
}

/**
 * ProjectCard - Display project information in a card format
 *
 * Shows project name, address, type, status, and start date.
 * Card is clickable and navigates to project detail page.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const statusColors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-600",
  }

  const typeLabels: Record<string, string> = {
    renovation: "Renovation",
    new_build: "New Build",
    development: "Development",
    maintenance: "Maintenance",
  }

  return (
    <Link href={`/projects/${project.id}` as never}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{project.name}</CardTitle>
            <Badge className={statusColors[project.status] || "bg-gray-100 text-gray-800"}>
              {project.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            {project.address?.formattedAddress && (
              <p className="line-clamp-1">{project.address.formattedAddress}</p>
            )}
            <div className="flex gap-4">
              <span>Type: {typeLabels[project.projectType] || project.projectType}</span>
              {project.startDate && (
                <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
