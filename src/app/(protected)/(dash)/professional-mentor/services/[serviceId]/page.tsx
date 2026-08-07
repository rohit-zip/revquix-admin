"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import ServiceDetailView from "@/features/professional-mentor/console/service-detail-view"

/**
 * One service: the publish gate and the marketplace projection on one page, because a service
 * can be invisible for either reason and they used to live on different consoles.
 */
export default function Page({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = use(params)
  return (
    <PageGuard>
      <ServiceDetailView serviceId={serviceId} />
    </PageGuard>
  )
}
