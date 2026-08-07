"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorOrdersView from "@/features/professional-mentor/console/orders-view"

/**
 * Orders, refunds and package entitlements — three tabs, because all three are artefacts of the
 * same purchase and an operator moving between them is following one customer's money.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorOrdersView />
    </PageGuard>
  )
}
