"use client"

import PageGuard from "@/components/page-guard"
import AdminQuotesView from "@/features/offer-service/admin-quotes-view"

export default function CustomQuotesPage() {
  return (
    <PageGuard>
      <AdminQuotesView />
    </PageGuard>
  )
}
