"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorPayoutsView from "@/features/professional-mentor/console/payouts-view"

/**
 * Payouts, wallets and reports as three tabs of one page. They were three sidebar rows over
 * three views of the same number, and switching between them threw away your filters.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorPayoutsView />
    </PageGuard>
  )
}
