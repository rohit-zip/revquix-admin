"use client"

import PageGuard from "@/components/page-guard"
import AdminPayoutsView from "@/features/professional-mentor/admin-payouts-view"

export default function PayoutsPage() {
  return (
    <PageGuard>
      <AdminPayoutsView />
    </PageGuard>
  )
}

