import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/api/auth"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Better Auth uses "better-auth.session_token" as the default cookie name
  const sessionCookie = request.cookies.get("better-auth.session_token")

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /assets/* (public assets like logos)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
}
