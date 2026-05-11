"use client"

import PageGuard from "@/components/page-guard"
import PayoutReportsView from "@/features/professional-mentor/payout-reports-view"

export default function PayoutReportsPage() {
  return (
    <PageGuard>
      <PayoutReportsView />
    </PageGuard>
  )
}
