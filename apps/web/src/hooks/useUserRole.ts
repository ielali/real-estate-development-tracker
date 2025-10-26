/**
 * useUserRole Hook
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Provides access to the current user's system-wide role and helper booleans.
 * Used for conditional rendering and role-based UI decisions.
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { role, isAdmin, isPartner, isLoading } = useUserRole()
 *
 *   if (isLoading) return <Spinner />
 *   if (!isAdmin) return <AccessDenied />
 *
 *   return <div>Admin Controls...</div>
 * }
 * ```
 */

import { useSession } from "@/lib/auth-client"

export interface UserRole {
  role: "admin" | "partner" | null
  isAdmin: boolean
  isPartner: boolean
  isLoading: boolean
}

export function useUserRole(): UserRole {
  const { data: session, isPending } = useSession()

  // Type assertion needed because Better Auth doesn't include custom role field in default types
  const role =
    ((session?.user as { role?: "admin" | "partner" })?.role as "admin" | "partner") || null

  return {
    role,
    isAdmin: role === "admin",
    isPartner: role === "partner",
    isLoading: isPending,
  }
}
