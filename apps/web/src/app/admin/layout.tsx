"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Admin Layout
 *
 * Provides a consistent layout for admin pages with:
 * - Sidebar navigation
 * - Active link highlighting
 * - Responsive design
 */

interface AdminNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const adminNavItems: AdminNavItem[] = [
  {
    title: "Security Dashboard",
    href: "/admin/security",
    icon: Shield,
    description: "2FA adoption and security metrics",
  },
  // Future admin pages can be added here
  // {
  //   title: "User Management",
  //   href: "/admin/users",
  //   icon: Users,
  //   description: "Manage user accounts",
  // },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen pb-20 md:pb-0">
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 border-r bg-muted/10 lg:block">
        <div className="sticky top-0 space-y-4 py-6">
          <div className="px-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>

            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div
                        className={cn(
                          "text-xs",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-6 py-6 lg:py-8 max-w-7xl">
          {/* Mobile navigation - shown on small screens */}
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm whitespace-nowrap transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
