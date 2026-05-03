"use client"

import PageGuard from "@/components/page-guard"
import AdminOfferCouponsView from "@/features/offer-service/admin-offer-coupons-view"

export default function OfferCouponsPage() {
  return (
    <PageGuard>
      <AdminOfferCouponsView />
    </PageGuard>
  )
}
