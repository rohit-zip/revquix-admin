"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

/**
 * AuthRouteGuard wraps auth-related routes (/auth/login, /auth/register)
 * and prevents logged-in users from accessing them.
 *
 * Behavior:
 * - If user is logged in → silently redirect to home
 * - If user is NOT logged in → show the auth page normally
 * - Waits for hasCheckedAuth = true before making redirect decision
 *   (prevents flashing login page during app initialization)
 *
 * Exclusions:
 * - /auth/callback is explicitly excluded because the user arrives there
 *   mid-authentication without a session. After the OAuth2 code exchange
 *   completes, the callback page dispatches setCredentials and redirects
 *   itself — any guard redirect here would race with that navigation.
 */

/** Paths under /auth that must never trigger the logged-in redirect. */
const EXCLUDED_AUTH_PATHS = [PATH_CONSTANTS.AUTH_CALLBACK]

export default function AuthRouteGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useSelector((state: RootState) => state.auth)
  const { hasCheckedAuth } = useSelector(
    (state: RootState) => state.authInitialization,
  )

  useEffect(() => {
    // Wait until the initial auth check (token refresh attempt) has completed
    if (!hasCheckedAuth) return

    // Never redirect from mid-auth pages — they handle their own navigation
    if (EXCLUDED_AUTH_PATHS.some((p) => pathname.startsWith(p))) return

    // Logged-in user visiting a public auth page → send them to the dashboard
    if (user) {
      router.replace(PATH_CONSTANTS.DASHBOARD)
    }
  }, [hasCheckedAuth, user, router, pathname])

  // Always render children — the effect above handles redirects asynchronously
  return children
}
