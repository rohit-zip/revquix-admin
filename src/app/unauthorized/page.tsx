"use client"

import Link from "next/link"
import { ShieldX, LogOut, ArrowLeft } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/core/store"
import { useLogout } from "@/features/auth/api/auth.hooks"
import Logo from "@/components/logo"

/**
 * ─── UNAUTHORIZED ACCESS PAGE ────────────────────────────────────────────────
 *
 * Shown when an authenticated user's role/permissions do not satisfy
 * ADMIN_APP_ACCESS config (i.e. they are not an admin/staff member).
 *
 * Provides:
 *   • Clear explanation of why access was denied
 *   • Back to Dashboard link (points to revquix-dashboard)
 *   • Logout button
 *   • Shows the user's email and roles for support reference
 */

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:2000"

export default function UnauthorizedPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const currentUser = useSelector((state: RootState) => state.userProfile.currentUser)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const roleNames = currentUser?.roles?.map((r) => r.name) ?? []

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-5 py-20 text-center">
      {/* Background glow orbs */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ contain: "strict" }}
      >
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[130px]" />
        <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-orange-500/8 blur-[100px]" />
        <div className="absolute -right-20 top-0 h-[400px] w-[400px] rounded-full bg-primary-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-semibold">Revquix Admin</span>
        </div>

        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10">
          <ShieldX className="h-10 w-10 text-red-400" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Unauthorised Access
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            You don&apos;t have permission to access the{" "}
            <span className="font-medium text-foreground">Revquix Admin Panel</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            This area is restricted to administrators and authorised staff only.
            If you believe this is a mistake, please contact your system administrator.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={DASHBOARD_URL}>
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-600 sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </div>
          </a>

          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* User context — helps support diagnose access issues */}
        {user && (
          <div className="w-full rounded-xl border border-border/60 bg-muted/40 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your account details
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-muted-foreground">Email</span>
                <span className="font-mono text-xs text-foreground">{user.email}</span>
              </div>
              {roleNames.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Roles</span>
                  <div className="flex flex-wrap gap-1">
                    {roleNames.map((role) => (
                      <span
                        key={role}
                        className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

