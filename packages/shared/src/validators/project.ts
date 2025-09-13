import { z } from "zod"
import { PROJECT_STATUSES } from "../constants"

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  address: z.string().min(1, "Address is required"),
  startDate: z.date(),
  status: z.enum(PROJECT_STATUSES),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial()
