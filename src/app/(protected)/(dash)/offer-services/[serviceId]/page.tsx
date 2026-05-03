"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminOfferServiceDetailView from "@/features/offer-service/admin-offer-service-detail-view"

export default function OfferServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = use(params)
  return (
    <PageGuard>
      <AdminOfferServiceDetailView serviceId={serviceId} />
    </PageGuard>
  )
}
