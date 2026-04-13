"use client"

import PageGuard from "@/components/page-guard"
import AdminPaymentsView from "@/features/payment/admin-payments-view"

export default function PaymentsPage() {
  return (
    <PageGuard>
      <AdminPaymentsView />
    </PageGuard>
  )
}

