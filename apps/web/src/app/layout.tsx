import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers/Providers"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real Estate Development Tracker",
  description: "Manage real estate development projects with ease",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
