"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminOfferOrderDetailView from "@/features/offer-service/admin-offer-order-detail-view"

export default function OfferOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = use(params)
  return (
    <PageGuard>
      <AdminOfferOrderDetailView orderId={orderId} />
    </PageGuard>
  )
}
