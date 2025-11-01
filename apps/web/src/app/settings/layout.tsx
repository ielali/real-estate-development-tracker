"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Shield, User, Settings as SettingsIcon } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"

/**
 * SettingsLayout - Provides consistent layout for all settings pages
 *
 * Features:
 * - Main navigation navbar
 * - Responsive sidebar navigation
 * - Active state highlighting
 * - Mobile-optimized tab navigation
 *
 * Note: Individual pages handle their own breadcrumb navigation for flexibility
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems: Array<{
    href: string
    label: string
    icon: typeof User
    description: string
  }> = [
    {
      href: "/settings/profile",
      label: "Profile",
      icon: User,
      description: "Manage your personal information",
    },
    {
      href: "/settings/security",
      label: "Security",
      icon: Shield,
      description: "Password and two-factor authentication",
    },
    {
      href: "/settings/preferences",
      label: "Preferences",
      icon: SettingsIcon,
      description: "Notifications and app settings",
    },
  ]

  return (
    <>
      <Navbar />
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2 transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{item.label}</div>
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
          </aside>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden border-b">
            <nav className="flex gap-2 overflow-x-auto pb-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href as any}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  )
}
