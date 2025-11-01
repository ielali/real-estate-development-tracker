"use client"

import { SecuritySettingsSection } from "@/components/auth"
import { SecurityActivityLog } from "@/components/security/SecurityActivityLog"
import { Breadcrumb } from "@/components/ui/breadcrumb"

/**
 * SecuritySettingsPage - Manage account security
 *
 * Displays two-factor authentication settings, password management,
 * trusted devices, backup codes, and security activity log.
 */
export default function SecuritySettingsPage() {
  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "Security" }]

  return (
    <div>
      <Breadcrumb items={breadcrumbs} className="mb-6" />
      <SecuritySettingsSection />
      <div className="mt-8">
        <SecurityActivityLog />
      </div>
    </div>
  )
}
