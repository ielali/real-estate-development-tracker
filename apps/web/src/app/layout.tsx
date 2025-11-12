import { Inter } from "next/font/google"
import Script from "next/script"
import { Providers } from "@/components/providers/Providers"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { OfflineBanner } from "@/components/ui/offline-banner"
import { CommandPalette } from "@/components/search/CommandPalette"
import { BottomTabBar } from "@/components/navigation/BottomTabBar"
import { MobileNavigation } from "@/components/layout/MobileNavigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { ContentWrapper } from "@/components/layout/ContentWrapper"
import "../styles/globals.css"

// Configure Inter font with optimized loading strategy (Epic 10)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
})

export const metadata = {
  title: "Real Estate Development Tracker",
  description: "Manage real estate development projects with ease",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Real Estate Development Tracker",
    description: "Manage real estate development projects with ease",
    type: "website",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`}
            strategy="afterInteractive"
          />
        )}
        <ErrorBoundary>
          <OfflineBanner />
          <Providers>
            {/* Desktop Sidebar - Story 10.3 */}
            <Sidebar />

            {/* Content Wrapper - Adjusts margin based on sidebar state */}
            <ContentWrapper>{children}</ContentWrapper>

            {/* Global Components */}
            <CommandPalette />
            <BottomTabBar />
            <MobileNavigation />
          </Providers>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  )
}
