"use client"

import { AuthProvider } from "./AuthProvider"
import { TRPCProvider } from "@/lib/trpc/Provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>{children}</AuthProvider>
    </TRPCProvider>
  )
}
