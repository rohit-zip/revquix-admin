"use client"

import PageGuard from "@/components/page-guard"
import PlatformHealthViewWithSuspense from "@/features/professional-mentor/console/platform-health-view"

/**
 * The eight engineering diagnostics as tabs on one page.
 *
 * The view reads `?tab=` through `useSearchParams`, so the export it uses carries its own
 * Suspense boundary — that hook has nothing to return while this route is prerendered.
 */
export default function Page() {
  return (
    <PageGuard>
      <PlatformHealthViewWithSuspense />
    </PageGuard>
  )
}
