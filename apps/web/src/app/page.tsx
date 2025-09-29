"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { UserDropdown } from "@/components/ui/UserDropdown"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-background">
      {/* Header with user info and logout */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Real Estate Portfolio</h2>
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {user ? `Welcome back, ${user.name || user.email}!` : "Real Estate Development Tracker"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for managing real estate development projects, tracking costs,
            managing contacts, and providing transparent partner dashboards.
          </p>

          {user ? (
            <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4">Your Account</h2>
              <div className="space-y-2 text-left">
                <p className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{user.email}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium">{user.name || "Not set"}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Email Verified:</span>{" "}
                  <span className="font-medium">{user.emailVerified ? "Yes" : "No"}</span>
                </p>
                {user.createdAt && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Member Since:</span>{" "}
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">Not Logged In</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please log in to access your dashboard.
              </p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
