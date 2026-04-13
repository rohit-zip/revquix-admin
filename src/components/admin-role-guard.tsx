"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { hasAdminAppAccess, ADMIN_APP_ACCESS } from "@/config/admin-access.config"

/**
 * ─── ADMIN ROLE GUARD ────────────────────────────────────────────────────────
 *
 * App-level access gate for the entire revquix-admin application.
 *
 * Runs AFTER the standard auth check (user is already confirmed to be
 * authenticated by the time this component renders).
 *
 * Behaviour:
 *   • Waits until the user profile has been fetched (authorities are loaded)
 *   • Evaluates the user's `authorities` against ADMIN_APP_ACCESS config
 *   • Users that DO NOT satisfy the config → redirect to /unauthorized
 *   • Users that DO satisfy the config → render children normally
 *
 * The /unauthorized path itself is excluded to prevent redirect loops.
 */
export default function AdminRoleGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const hasFetched = useSelector((state: RootState) => state.userProfile.hasFetched)
  const isFetching = useSelector((state: RootState) => state.userProfile.isFetching)
  const authorities = useSelector(
    (state: RootState) => state.userProfile.currentUser?.authorities ?? [],
  )

  const isUnauthorizedPage = pathname === ADMIN_APP_ACCESS.unauthorizedRedirectPath

  useEffect(() => {
    // Wait until profile is loaded before evaluating
    if (isFetching || !hasFetched) return

    // Never redirect from /unauthorized — would cause infinite loop
    if (isUnauthorizedPage) return

    // Redirect if the user lacks admin access
    if (!hasAdminAppAccess(authorities)) {
      router.replace(ADMIN_APP_ACCESS.unauthorizedRedirectPath)
    }
  }, [hasFetched, isFetching, authorities, router, isUnauthorizedPage])

  // While profile is loading, render nothing (AuthCheckLoader covers the UI)
  if (isFetching || !hasFetched) {
    if (!isUnauthorizedPage) return null
  }

  return <>{children}</>
}

