"use client"

import { Suspense, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

/**
 * ─── LEGACY V2 CONSOLE REDIRECTS ──────────────────────────────────────────────
 *
 * Every `/mentorship-v2/*` route now lives under `/professional-mentor/*`. This catch-all keeps the
 * old ones working, and it is not optional for two of them:
 *
 *  • **`/mentorship-v2/disputes?disputeId=DSP…`** is hard-coded into every admin dispute-alert email
 *    ever sent. Those cannot be rewritten, and a dead link in an escalation email is worse than an
 *    extra hop — so the query parameter is translated into the new path segment rather than dropped.
 *  • The eight diagnostic consoles are bookmarked by engineers. They land on Platform Health with
 *    their tab already selected.
 *
 * An optional catch-all (`[[...path]]`) so the bare `/mentorship-v2` index redirects too.
 *
 * `router.replace`, never `push`: the old URL should not sit in the history for the back button to
 * bounce off.
 */

const TABS = PATH_CONSTANTS.ADMIN_PM_PLATFORM_TABS

/** Old first segment → where it lives now. */
const DIRECT: Record<string, string> = {
  disputes: PATH_CONSTANTS.ADMIN_PM_DISPUTES,
  calls: PATH_CONSTANTS.ADMIN_PM_SESSIONS,
  commerce: PATH_CONSTANTS.ADMIN_PM_ORDERS,
  services: PATH_CONSTANTS.ADMIN_PM_SERVICES,
}

/** Old first segment → the Platform Health tab that absorbed it. */
const PLATFORM_TAB: Record<string, string> = {
  availability: TABS.AVAILABILITY,
  pricing: TABS.PRICING,
  search: TABS.SEARCH,
  semantic: TABS.SEMANTIC,
  packages: TABS.PACKAGES,
  cutover: TABS.MIGRATION,
  verification: TABS.FOUNDATIONS,
}

function LegacyRedirect() {
  const router = useRouter()
  const params = useParams<{ path?: string[] }>()
  const searchParams = useSearchParams()

  useEffect(() => {
    const segments = params?.path ?? []
    const head = segments[0] ?? ""

    // The dispute deep link: `?disputeId=` was how the single-page console opened one case.
    if (head === "disputes") {
      const disputeId = searchParams.get("disputeId")?.trim()
      router.replace(
        disputeId
          ? `${PATH_CONSTANTS.ADMIN_PM_DISPUTES}/${encodeURIComponent(disputeId)}`
          : PATH_CONSTANTS.ADMIN_PM_DISPUTES,
      )
      return
    }

    if (DIRECT[head]) {
      router.replace(DIRECT[head])
      return
    }

    if (PLATFORM_TAB[head]) {
      router.replace(`${PATH_CONSTANTS.ADMIN_PM_PLATFORM}?tab=${PLATFORM_TAB[head]}`)
      return
    }

    router.replace(PATH_CONSTANTS.ADMIN_PM_HOME)
  }, [params, router, searchParams])

  return (
    <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Taking you to the new console…
    </p>
  )
}

export default function Page() {
  // useSearchParams needs a Suspense boundary — it has nothing to return while prerendering.
  return (
    <Suspense fallback={null}>
      <LegacyRedirect />
    </Suspense>
  )
}
