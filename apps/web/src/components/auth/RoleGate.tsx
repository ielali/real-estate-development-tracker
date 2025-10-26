/**
 * RoleGate Component
 *
 * Story 4.2 - Role-Based Access Control
 *
 * Conditionally renders children based on user's system-wide role.
 * Used for role-based UI rendering (admin-only features, partner-only views).
 *
 * @param allowedRoles - Array of roles that are allowed to see the children
 * @param fallback - Optional component to render if user doesn't have required role
 * @param children - Content to render if user has required role
 *
 * @example
 * ```tsx
 * // Admin-only button
 * <RoleGate allowedRoles={["admin"]}>
 *   <Button onClick={handleDeleteAll}>Delete All Projects</Button>
 * </RoleGate>
 *
 * // Show different content for unauthorized users
 * <RoleGate
 *   allowedRoles={["admin"]}
 *   fallback={<p>Admin access required</p>}
 * >
 *   <AdminPanel />
 * </RoleGate>
 *
 * // Allow both roles
 * <RoleGate allowedRoles={["admin", "partner"]}>
 *   <ProjectList />
 * </RoleGate>
 * ```
 */

import React, { ReactNode } from "react"
import { useUserRole } from "@/hooks/useUserRole"

export interface RoleGateProps {
  allowedRoles: Array<"admin" | "partner">
  fallback?: ReactNode
  children: ReactNode
}

export function RoleGate({ allowedRoles, fallback = null, children }: RoleGateProps) {
  const { role, isLoading } = useUserRole()

  // While loading, don't show anything to prevent flashing
  if (isLoading) {
    return null
  }

  // Check if user has required role
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
