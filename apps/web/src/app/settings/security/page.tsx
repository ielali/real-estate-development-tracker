import { SecuritySettingsSection } from "@/components/auth"

export default function SecuritySettingsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account security and two-factor authentication
        </p>
      </div>

      <SecuritySettingsSection />
    </div>
  )
}
