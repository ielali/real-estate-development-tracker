"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { useState } from "react"
import superjson from "superjson"
import { api } from "./client"

function getBaseUrl() {
  if (typeof window !== "undefined") return ""
  return process.env.DEPLOY_PRIME_URL
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
