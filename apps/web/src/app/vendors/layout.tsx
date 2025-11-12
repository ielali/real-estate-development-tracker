"use client"

/**
 * Vendors Layout - Provides consistent layout for all vendor pages
 *
 * Features:
 * - Consistent page structure with padding for mobile navigation
 *
 * Note: Individual pages handle their own breadcrumb navigation
 */
export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-20 md:pb-0">{children}</div>
}
