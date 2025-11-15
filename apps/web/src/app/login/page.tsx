"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/LoginForm"
import { TwoFactorForm } from "@/components/auth/TwoFactorForm"
import { useAuth } from "@/components/providers/AuthProvider"

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [showTwoFactor, setShowTwoFactor] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  const handleLoginSuccess = (requires2FA: boolean) => {
    if (requires2FA) {
      setShowTwoFactor(true)
    } else {
      router.push("/")
    }
  }

  const handle2FASuccess = () => {
    router.push("/")
  }

  const handleBackToLogin = () => {
    setShowTwoFactor(false)
  }

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // Don't render the form if user is logged in (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel: Hero Image (Hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 h-screen">
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
          }}
        >
          <div className="absolute inset-0 bg-slate-900/60"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Real Estate Development Tracker"
              width={120}
              height={36}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          {/* Hero Text */}
          <div className="max-w-md">
            <h2 className="text-4xl font-black mb-4">
              Manage your development projects with confidence
            </h2>
            <p className="text-slate-200 text-lg">
              Track costs, timelines, contacts, and every detail of your real estate development
              projects in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background-light dark:bg-background-dark p-6 sm:p-8 lg:p-12">
        <div className="flex flex-col max-w-md w-full gap-8">
          {/* Mobile Logo */}
          <div className="flex justify-start lg:hidden">
            <Image
              src="/logo.png"
              alt="Real Estate Development Tracker"
              width={150}
              height={45}
              className="object-contain dark:brightness-0 dark:invert"
              priority
            />
          </div>

          {/* Show either Login Form or 2FA Form */}
          {showTwoFactor ? (
            <TwoFactorForm onSuccess={handle2FASuccess} onBack={handleBackToLogin} />
          ) : (
            <LoginForm onSuccess={handleLoginSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}
