"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminPaymentDetailView from "@/features/payment/admin-payment-detail-view"

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentOrderId: string }>
}) {
  const { paymentOrderId } = use(params)
  return (
    <PageGuard>
      <AdminPaymentDetailView paymentOrderId={paymentOrderId} />
    </PageGuard>
  )
}
