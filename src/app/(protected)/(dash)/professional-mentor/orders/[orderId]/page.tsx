"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import OrderDetailView from "@/features/professional-mentor/console/order-detail-view"

/**
 * One order: the buyer ledger and the mentor ledger side by side, each in its own currency,
 * plus the linked session, intake answers and refund history.
 */
export default function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  return (
    <PageGuard>
      <OrderDetailView orderId={orderId} />
    </PageGuard>
  )
}
