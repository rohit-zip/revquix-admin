"use client"

import PageGuard from "@/components/page-guard"
import AdminOfferServicesView from "@/features/offer-service/admin-offer-services-view"

export default function OfferServicesPage() {
  return (
    <PageGuard>
      <AdminOfferServicesView />
    </PageGuard>
  )
}
