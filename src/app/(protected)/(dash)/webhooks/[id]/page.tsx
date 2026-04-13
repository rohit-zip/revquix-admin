"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import WebhookLogDetailView from "@/features/payment/webhook-log-detail-view"

export default function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <PageGuard>
      <WebhookLogDetailView id={Number(id)} />
    </PageGuard>
  )
}

