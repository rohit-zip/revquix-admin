"use client"

import PageGuard from "@/components/page-guard"
import AdminCreateQuoteView from "@/features/offer-service/admin-create-quote-view"

export default function CreateCustomQuotePage() {
  return (
    <PageGuard>
      <AdminCreateQuoteView />
    </PageGuard>
  )
}
