import { redirect } from "next/navigation"

/**
 * Admin Index Page
 *
 * Redirects to the main admin dashboard (Security Dashboard)
 */
export default function AdminPage() {
  redirect("/admin/security")
}
