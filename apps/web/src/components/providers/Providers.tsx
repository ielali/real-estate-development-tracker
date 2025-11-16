"use client"

import { AuthProvider } from "./AuthProvider"
import { TRPCProvider } from "@/lib/trpc/Provider"
import { CollapsedSidebarProvider } from "@/hooks/useCollapsedSidebar"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        <CollapsedSidebarProvider>{children}</CollapsedSidebarProvider>
      </AuthProvider>
    </TRPCProvider>
  )
}
