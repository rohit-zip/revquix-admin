/**
 * ─── ADMIN DASHBOARD VIEW ────────────────────────────────────────────────────
 *
 * Rendered on / when the active workspace is "admin".
 *
 * Content is composed dynamically based on the current user's authorities:
 *
 *  • ROLE_PROFESSIONAL_MENTOR (or ROLE_ADMIN)
 *      → Renders the Professional Mentor Dashboard widget inline, so mentors
 *        see their stats / calendar / quick-actions directly on the main
 *        dashboard without being redirected to a separate route.
 *
 *  • No mentor role (pure platform admin)
 *      → Renders a generic admin overview placeholder.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"

import React from "react"
import { ShieldCheck } from "lucide-react"

import { useAuthorization } from "@/hooks/useAuthorization"
import { PERMISSIONS } from "@/config/dashboard/nav.config"
import MentorDashboard from "@/features/professional-mentor/mentor-dashboard"

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Determines which "admin role" the current user primarily operates as.
 * Evaluation order: ROLE_PROFESSIONAL_MENTOR → ROLE_ADMIN (generic admin).
 */
type AdminRole = "professional-mentor" | "admin"

function resolveAdminRole(
  hasProfessionalMentor: boolean,
): AdminRole {
  if (hasProfessionalMentor) return "professional-mentor"
  return "admin"
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

/**
 * Shown when the user has no mentor role — a pure platform admin.
 * Replace / extend this with real analytics / KPI widgets as the admin
 * section matures.
 */
function GenericAdminOverview() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 py-16 text-center">
      <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">Admin Overview</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
        Platform-wide analytics and management tools will appear here.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboardView() {
  const { hasAnyAuthority } = useAuthorization()

  const isProfessionalMentor = hasAnyAuthority([
    PERMISSIONS.ROLE_PROFESSIONAL_MENTOR,
    PERMISSIONS.ROLE_ADMIN,
  ])

  const adminRole = resolveAdminRole(isProfessionalMentor)

  return (
    <>
      {adminRole === "professional-mentor" && <MentorDashboard />}
      {adminRole === "admin" && <GenericAdminOverview />}
    </>
  )
}

