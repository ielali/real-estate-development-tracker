import { createTRPCRouter } from "./trpc"
import { authRouter } from "./routers/auth"
import { projectRouter } from "./routers/project"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  projects: projectRouter,
})

export type AppRouter = typeof appRouter
