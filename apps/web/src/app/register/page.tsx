"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { RegistrationForm } from "@/components/auth/RegistrationForm"

export default function RegisterPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your admin account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to existing account
            </Link>
          </p>
        </div>
        <RegistrationForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
