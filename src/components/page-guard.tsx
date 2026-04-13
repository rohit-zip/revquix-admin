"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { ShieldX } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useAuthorization } from "@/hooks/useAuthorization"
import { PAGE_ACCESS_CONFIG, type PageAccessRule } from "@/config/page-access.config"
import NotFound from "@/app/not-found"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageGuardProps {
  children: React.ReactNode
  /**
   * OR logic — user must hold AT LEAST ONE of these authorities.
   * When provided, takes priority over PAGE_ACCESS_CONFIG lookup.
   */
  requireAnyAuthority?: string[]
  /**
   * AND logic — user must hold EVERY authority in this list.
   * Can be combined with requireAnyAuthority (both must pass).
   */
  requireAllAuthorities?: string[]
  /** Human-readable label for the dev watermark */
  label?: string
}

// ─── PageGuard ────────────────────────────────────────────────────────────────

/**
 * Guards a page/section based on the current user's authorities.
 *
 * Resolution order
 * ─────────────────
 *   1. Explicit props (`requireAnyAuthority` / `requireAllAuthorities`)
 *   2. PAGE_ACCESS_CONFIG lookup by current pathname
 *   3. No rule found → allow access (open page within the admin app)
 *
 * When access is denied
 * ─────────────────────
 *   • Renders the <NotFound /> UI in-place (URL stays unchanged)
 *   • Shows a developer watermark showing which authority check failed
 */
export default function PageGuard({
  children,
  requireAnyAuthority,
  requireAllAuthorities,
  label,
}: PageGuardProps) {
  const pathname = usePathname()
  const { hasFetched, isFetchingProfile } = useAuth()
  const { hasAnyAuthority, hasAllAuthorities } = useAuthorization()

  // Wait for user profile to load
  if (isFetchingProfile || !hasFetched) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  // Resolve the access rule
  let rule: PageAccessRule | null = null

  if (requireAnyAuthority || requireAllAuthorities) {
    rule = { anyOf: requireAnyAuthority, allOf: requireAllAuthorities, label }
  } else {
    const configKey = Object.keys(PAGE_ACCESS_CONFIG).find(
      (key) => pathname === key || pathname.startsWith(key + "/"),
    )
    if (configKey) {
      rule = PAGE_ACCESS_CONFIG[configKey]
    }
  }

  // No rule → open access within the admin app
  if (!rule) return <>{children}</>

  // Evaluate both anyOf (OR) and allOf (AND)
  const anyOfPasses = rule.anyOf?.length ? hasAnyAuthority(rule.anyOf) : true
  const allOfPasses = rule.allOf?.length ? hasAllAuthorities(rule.allOf) : true
  const hasAccess = anyOfPasses && allOfPasses

  if (hasAccess) return <>{children}</>

  const watermarkLabel = rule.label ?? label ?? pathname

  return (
    <>
      <NotFound />
      <PermissionDeniedWatermark
        label={watermarkLabel}
        anyOf={rule.anyOf}
        allOf={rule.allOf}
        anyOfPasses={anyOfPasses}
        allOfPasses={allOfPasses}
      />
    </>
  )
}

// ─── Developer watermark ──────────────────────────────────────────────────────

interface WatermarkProps {
  label: string
  anyOf?: string[]
  allOf?: string[]
  anyOfPasses: boolean
  allOfPasses: boolean
}

function PermissionDeniedWatermark({
  label,
  anyOf,
  allOf,
  anyOfPasses,
  allOfPasses,
}: WatermarkProps) {
  return (
    <div
      role="status"
      aria-label="Permission denied for this page"
      className={[
        "pointer-events-none fixed bottom-4 right-4 z-[9999]",
        "flex max-w-sm select-none flex-col gap-1.5",
        "rounded-lg border border-red-500/40 bg-red-950/90",
        "px-3 py-2.5 shadow-xl backdrop-blur-sm",
        "font-mono text-xs leading-tight text-red-300",
      ].join(" ")}
    >
      <div className="flex items-center gap-1.5">
        <ShieldX className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
        <span className="font-semibold tracking-wide text-red-200">
          🔒 Permission Denied
        </span>
      </div>

      <span className="text-[10px] text-red-400/70">{label}</span>

      <div className="flex flex-col gap-1 pt-0.5">
        {allOf?.length && (
          <div
            title={`Requires ALL of: ${allOf.join(", ")}`}
            className={[
              "flex items-center gap-1 rounded px-1.5 py-0.5",
              allOfPasses
                ? "bg-green-900/40 text-green-400"
                : "bg-red-900/50 text-red-300",
            ].join(" ")}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
              ALL&nbsp;OF
            </span>
            <span className="truncate">{allOf.join(" + ")}</span>
          </div>
        )}

        {anyOf?.length && (
          <div
            title={`Requires ONE of: ${anyOf.join(", ")}`}
            className={[
              "flex items-center gap-1 rounded px-1.5 py-0.5",
              anyOfPasses
                ? "bg-green-900/40 text-green-400"
                : "bg-red-900/50 text-red-300",
            ].join(" ")}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
              ANY&nbsp;OF
            </span>
            <span className="truncate">{anyOf.join(" | ")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

