/**
 * Type declarations to extend better-auth with additional user fields
 */

declare module "better-auth/types" {
  interface User {
    firstName?: string
    lastName?: string
    role?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      emailVerified: boolean
      image?: string | null
      createdAt: Date
      updatedAt: Date
      twoFactorEnabled?: boolean | null
      firstName?: string
      lastName?: string
      role?: string
    }
  }
}

declare module "better-auth/react" {
  interface SignInResponse {
    data?: {
      token: string
      user: {
        id: string
        email: string
        name: string
        image?: string | null
        emailVerified: boolean
        createdAt: Date
        updatedAt: Date
      }
      url?: string
      redirect: boolean
      twoFactorRedirect?: boolean
    }
    error?: {
      message: string
    }
  }
}

export {}
