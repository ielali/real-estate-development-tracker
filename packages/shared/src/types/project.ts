export interface Project {
  id: string
  name: string
  address: string
  startDate: Date
  status: "planning" | "in-progress" | "completed" | "on-hold"
  createdAt: Date
  updatedAt: Date
}
