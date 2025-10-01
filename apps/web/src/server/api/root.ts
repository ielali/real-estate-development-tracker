import { createTRPCRouter } from "./trpc"
import { authRouter } from "./routers/auth"
import { projectRouter } from "./routers/project"
import { costRouter } from "./routers/cost"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  projects: projectRouter,
  costs: costRouter,
})

export type AppRouter = typeof appRouter
