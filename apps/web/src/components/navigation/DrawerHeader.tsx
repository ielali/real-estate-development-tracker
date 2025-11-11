/**
 * DrawerHeader Component
 * Story 10.6: Swipeable Navigation Drawer
 *
 * User profile section for the navigation drawer
 * - Displays user avatar, name, and email if authenticated
 * - Shows login prompt if not authenticated
 */

"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { LogIn, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DrawerHeaderProps {
  onNavigate?: () => void
}

export function DrawerHeader({ onNavigate }: DrawerHeaderProps) {
  const { user, isLoading } = useAuth()

  // Generate user initials
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.[0]?.toUpperCase() || "U"
  }

  const initials = getInitials(user?.name, user?.email)

  // Loading state while auth initializes
  if (isLoading) {
    return (
      <div className="p-6 border-b bg-muted/10">
        <div className="flex items-center gap-4">
          {/* Skeleton Avatar */}
          <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />

          {/* Skeleton Info */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-32" />
            <div className="h-3 bg-muted rounded animate-pulse w-40" />
          </div>
        </div>
      </div>
    )
  }

  // Authenticated user view
  if (user) {
    return (
      <div className="p-6 border-b bg-muted/10">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div
            className={cn(
              "flex items-center justify-center",
              "w-14 h-14 rounded-full",
              "bg-primary text-primary-foreground",
              "text-lg font-semibold"
            )}
          >
            {initials}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate">{user.name || "User"}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Link href="/settings/profile" className="flex-1" onClick={onNavigate}>
            <Button variant="outline" size="sm" className="w-full">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Unauthenticated user view
  return (
    <div className="p-6 border-b bg-muted/10">
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <UserIcon className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Welcome!</p>
          <p className="text-sm text-muted-foreground">Sign in to access all features</p>
        </div>
        <Link href="/login" className="block" onClick={onNavigate}>
          <Button className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  )
}
