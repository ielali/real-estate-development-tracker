"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { UserDropdown } from "@/components/ui/UserDropdown"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Navbar - Main navigation component
 *
 * Provides consistent navigation across all pages with user dropdown
 */
export function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = [
    { href: "/", label: "Home" },
    ...(user
      ? [
          { href: "/projects", label: "Projects" },
          { href: "/contacts", label: "Contacts" },
          { href: "/categories", label: "Categories" },
        ]
      : []),
  ]

  // Trigger command palette programmatically
  const handleSearchClick = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  // Detect OS for keyboard shortcut display
  const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K"

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="Real Estate Portfolio"
                width={100}
                height={300}
                className="object-contain h-16"
              />
            </Link>
            <nav className="hidden sm:flex gap-6">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"))
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-gray-900",
                      isActive ? "text-gray-900 border-b-2 border-gray-900 pb-1" : "text-gray-600"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Search button - only show for authenticated users */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchClick}
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {shortcutKey}
                </kbd>
              </Button>
            )}
            {/* Notifications - only show for authenticated users */}
            {user && <NotificationBell />}
            <UserDropdown />
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="flex sm:hidden gap-6 mt-4 pt-4 border-t">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gray-900",
                  isActive ? "text-gray-900 border-b-2 border-gray-900 pb-1" : "text-gray-600"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
