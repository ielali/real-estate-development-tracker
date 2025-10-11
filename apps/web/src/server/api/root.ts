import { createTRPCRouter } from "./trpc"
import { authRouter } from "./routers/auth"
import { projectRouter } from "./routers/project"
import { costRouter } from "./routers/cost"
import { contactRouter } from "./routers/contact"
import { projectContactRouter } from "./routers/projectContact"
import { categoryRouter } from "./routers/category"
import { documentsRouter } from "./routers/documents"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  projects: projectRouter,
  costs: costRouter,
  contacts: contactRouter,
  projectContacts: projectContactRouter,
  category: categoryRouter,
  documents: documentsRouter,
})

export type AppRouter = typeof appRouter
