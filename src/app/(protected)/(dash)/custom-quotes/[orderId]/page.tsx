"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminQuoteDetailView from "@/features/offer-service/admin-quote-detail-view"

export default function CustomQuoteDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = use(params)
  return (
    <PageGuard>
      <AdminQuoteDetailView orderId={orderId} />
    </PageGuard>
  )
}
