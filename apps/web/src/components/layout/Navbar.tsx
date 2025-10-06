"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserDropdown } from "@/components/ui/UserDropdown"
import { useAuth } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"

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
        ]
      : []),
  ]

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
          <UserDropdown />
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
