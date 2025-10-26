import { createTRPCRouter } from "./trpc"
import { authRouter } from "./routers/auth"
import { projectRouter } from "./routers/project"
import { costRouter } from "./routers/cost"
import { contactRouter } from "./routers/contact"
import { projectContactRouter } from "./routers/projectContact"
import { categoryRouter } from "./routers/category"
import { documentsRouter } from "./routers/documents"
import { eventsRouter } from "./routers/events"
import { partnersRouter } from "./routers/partners"
import { auditLogRouter } from "./routers/auditLog"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  projects: projectRouter,
  costs: costRouter,
  contacts: contactRouter,
  projectContacts: projectContactRouter,
  category: categoryRouter,
  documents: documentsRouter,
  events: eventsRouter,
  partners: partnersRouter,
  auditLog: auditLogRouter,
})

export type AppRouter = typeof appRouter
