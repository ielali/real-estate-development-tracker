import { Navbar } from "@/components/layout/Navbar"
import { ProjectCreateForm } from "@/components/projects/ProjectCreateForm"
import { Breadcrumb, breadcrumbHelpers } from "@/components/ui/breadcrumb"

export default function NewProjectPage() {
  return (
    <>
      <Navbar />
      <div className="container max-w-2xl py-10">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbHelpers.newProject()} />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-gray-600 mt-2">Add a new real estate development project to track</p>
        </div>
        <ProjectCreateForm />
      </div>
    </>
  )
}
