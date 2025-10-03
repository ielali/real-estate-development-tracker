import { initTRPC, TRPCError } from "@trpc/server"
import { type NextRequest } from "next/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { auth } from "@/server/auth"
import { db } from "@/server/db"

export const createTRPCContext = async (opts: {
  headers: Headers
  req?: NextRequest
  db?: typeof db
}) => {
  let session = null

  try {
    session = await auth.api.getSession({
      headers: opts.headers,
    })
  } catch (error) {
    console.warn("Failed to get session:", error)
  }

  return {
    db: opts.db ?? db,
    session,
    user: session?.user ?? null,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
