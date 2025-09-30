import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Providers } from "@/components/providers/Providers"
import { Toaster } from "@/components/ui/toaster"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real Estate Development Tracker",
  description: "Manage real estate development projects with ease",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <html lang="en">
      <head>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
