"use client"

import { ProfileSettingsSection } from "@/components/auth/ProfileSettingsSection"
import { Breadcrumb } from "@/components/ui/breadcrumb"

/**
 * ProfileSettingsPage - User profile management
 *
 * Allows users to update their first name, last name, and view account information.
 */
export default function ProfileSettingsPage() {
  const breadcrumbs = [{ label: "Settings", href: "/settings" }, { label: "Profile" }]

  return (
    <div>
      <Breadcrumb items={breadcrumbs} className="mb-6" />
      <ProfileSettingsSection />
    </div>
  )
}
