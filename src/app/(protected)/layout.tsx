"use client"

import { useEffect, useTransition } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import AuthCheckLoader from "@/components/auth-check-loader"
import AdminRoleGuard from "@/components/admin-role-guard"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

/**
 * ─── PROTECTED LAYOUT — revquix-admin ───────────────────────────────────────
 *
 * Two-step gate:
 *   1. Standard auth check — redirects to /auth/login if no session
 *   2. Admin role gate — redirects to /unauthorized if wrong role/permission
 *
 * The AdminRoleGuard component handles step 2 declaratively based on
 * ADMIN_APP_ACCESS config, keeping this layout clean.
 */
export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, hasCheckedAuth, isChecking, needsProfile, hasFetched, isFetchingProfile } =
    useAuth()

  const [isTransitioning, startTransition] = useTransition()

  useEffect(() => {
    if (!hasCheckedAuth) return

    if (!user) {
      router.replace(PATH_CONSTANTS.AUTH_LOGIN)
      return
    }
  }, [hasCheckedAuth, user, router, pathname])

  // Still performing initial auth check
  if (isChecking || !hasCheckedAuth) {
    return <AuthCheckLoader />
  }

  // Not authenticated — render nothing while redirect fires
  if (!user) {
    return null
  }

  // Profile still loading
  if (isFetchingProfile || !hasFetched) {
    return <AuthCheckLoader />
  }

  // Authenticated — pass through AdminRoleGuard for role/permission check
  return (
    <AdminRoleGuard>
      {children}
    </AdminRoleGuard>
  )
}

