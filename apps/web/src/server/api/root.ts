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
import { partnerDashboardRouter } from "./routers/partnerDashboard"
import { usersRouter } from "./routers/users"
import { securityRouter } from "./routers/security"
import { searchRouter } from "./routers/search"
import { notificationRouter } from "./routers/notification"
import { notificationPreferencesRouter } from "./routers/notification_preferences"
import { commentsRouter } from "./routers/comments"
import { reportsRouter } from "./routers/reports"
import { portfolioRouter } from "./routers/portfolio"

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
  partnerDashboard: partnerDashboardRouter,
  users: usersRouter,
  security: securityRouter,
  search: searchRouter,
  notifications: notificationRouter,
  notificationPreferences: notificationPreferencesRouter,
  comments: commentsRouter,
  reports: reportsRouter,
  portfolio: portfolioRouter,
})

export type AppRouter = typeof appRouter
