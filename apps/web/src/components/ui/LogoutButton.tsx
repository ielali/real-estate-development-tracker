"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthProvider"

export function LogoutButton() {
  const { logout } = useAuth()

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-2">
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  )
}
