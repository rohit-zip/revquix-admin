import PageGuard from "@/components/page-guard"
import WebhookLogsView from "@/features/payment/webhook-logs-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Webhook Logs",
  description: "View all Razorpay webhook events received by the platform.",
}

export default function WebhooksPage() {
  return (
    <PageGuard>
      <WebhookLogsView />
    </PageGuard>
  )
}

