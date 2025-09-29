"use client"

import { createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface User {
  id: string
  email: string
  name: string
  role?: "admin" | "partner"
  emailVerified?: boolean
  createdAt?: string
}

interface SessionUser {
  id: string
  email: string
  name: string
  role?: "admin" | "partner"
  emailVerified?: boolean
  createdAt?: Date
  [key: string]: unknown // For any additional fields from Better Auth
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending: isLoading } = authClient.useSession()

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as SessionUser).role || "admin",
        emailVerified: (session.user as SessionUser).emailVerified,
        createdAt: (session.user as SessionUser).createdAt?.toISOString(),
      }
    : null

  const login = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message || "Login failed")
    }

    if (data) {
      router.push("/")
    }
  }

  const logout = async () => {
    try {
      await authClient.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const register = async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    const { data: result, error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: `${data.firstName} ${data.lastName}`,
      callbackURL: "/",
    })

    if (error) {
      throw new Error(error.message || "Registration failed")
    }

    if (result) {
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
