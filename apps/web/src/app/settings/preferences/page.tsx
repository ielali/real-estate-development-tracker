"use client"

import { PreferencesSettingsSection } from "@/components/auth/PreferencesSettingsSection"
import { Breadcrumb } from "@/components/ui/breadcrumb"

/**
 * PreferencesSettingsPage - User preferences and notifications
 *
 * Allows users to configure email notifications and app preferences.
 */
export default function PreferencesSettingsPage() {
  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "Preferences" }]

  return (
    <div>
      <Breadcrumb items={breadcrumbs} className="mb-6" />
      <PreferencesSettingsSection />
    </div>
  )
}
