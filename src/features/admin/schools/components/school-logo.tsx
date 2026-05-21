"use client"

import { useState } from "react"
import { GraduationCap } from "lucide-react"
import type { AdminSchoolResponse } from "@/features/admin/schools/school.types"

// ─── School Logo ──────────────────────────────────────────────────────────────

interface SchoolLogoProps {
  school: AdminSchoolResponse | { name: string; logoUrl: string | null; domain: string | null }
  size?: "sm" | "md"
}

/**
 * Renders a school logo using the priority chain:
 *   1. `logoUrl` (admin-set override)
 *   2. Clearbit logo via `domain`
 *   3. Initials fallback (first letter of name, rounded square with bg-primary/10)
 *
 * The graduation-cap icon is shown only when no domain is available AND no logoUrl.
 * For schools with a domain, we rely on Clearbit and fall back to initials on 404.
 */
export function SchoolLogo({ school, size = "sm" }: SchoolLogoProps) {
  const src = school.logoUrl ?? (school.domain ? `https://logo.clearbit.com/${school.domain}` : null)
  const [imgError, setImgError] = useState(false)
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  if (!src || imgError) {
    const initial = school.name?.charAt(0)?.toUpperCase()
    if (initial) {
      return (
        <div
          className={`flex ${dim} items-center justify-center rounded bg-primary/10 ${textSize} font-bold text-primary`}
        >
          {initial}
        </div>
      )
    }
    return (
      <div
        className={`flex ${dim} items-center justify-center rounded bg-primary/10 text-primary`}
      >
        <GraduationCap className="h-4 w-4" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={school.name}
      className={`${dim} rounded object-contain`}
      onError={() => setImgError(true)}
    />
  )
}
