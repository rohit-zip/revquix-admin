import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * ─── REVQUIX ADMIN MIDDLEWARE ─────────────────────────────────────────────────
 *
 * Cookie-based session gate for the admin panel.
 * Role / permission checks happen client-side in (protected)/layout.tsx —
 * JWT is unavailable in Edge middleware.
 *
 * RULES:
 *   0. Maintenance mode ON → all routes serve /maintenance
 *   1. Logged-in user on /auth/login or /auth/register → /
 *   2. Auth pages (/auth/*) are always accessible for non-logged-in users
 *   3. Static assets pass through
 *   4. Everything else requires a session cookie → /auth/login
 */

const AUTH_ONLY_PATTERNS = [
  /^\/auth\/login(?:\/|$|\?)/,
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rule 0 — Maintenance mode ─────────────────────────────────────────────
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
  if (isMaintenanceMode && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }
  if (isMaintenanceMode) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has("rv_session")

  // ── Rule 1 — Logged-in users skip auth pages ──────────────────────────────
  if (hasSession && AUTH_ONLY_PATTERNS.some((r) => r.test(pathname))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // ── Rule 2 — /auth/* is always accessible ─────────────────────────────────
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // ── Rule 3 — Static assets pass through ───────────────────────────────────
  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return NextResponse.next()
  }

  // ── Allow /unauthorized regardless of session ─────────────────────────────
  // (avoids redirect loops when an authenticated user lacks admin access)
  if (pathname === "/unauthorized") {
    return NextResponse.next()
  }

  // ── Rule 4 — Everything else requires a session ───────────────────────────
  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
}

