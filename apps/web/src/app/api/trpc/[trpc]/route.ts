import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { type NextRequest } from "next/server"
import { appRouter } from "@/server/api/root"
import { createTRPCContext } from "@/server/api/trpc"

// Force Node.js runtime for @react-pdf/renderer compatibility
// Edge runtime doesn't support React reconciler used by @react-pdf/renderer
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        req,
      }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`❌ tRPC Error on \`${path ?? "<no-path>"}\`:`, error)
            console.error("Error stack:", error.stack)
            if (error.cause) {
              console.error("Error cause:", error.cause)
            }
          }
        : undefined,
  })

export { handler as GET, handler as POST }
