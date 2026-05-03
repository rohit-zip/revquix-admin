"use client"

import PageGuard from "@/components/page-guard"
import AdminOfferOrdersView from "@/features/offer-service/admin-offer-orders-view"

export default function OfferOrdersPage() {
  return (
    <PageGuard>
      <AdminOfferOrdersView />
    </PageGuard>
  )
}
