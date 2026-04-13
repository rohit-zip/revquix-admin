"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminMentorWalletDetailView from "@/features/payment/admin-mentor-wallet-detail-view"

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ mentorUserId: string }>
}) {
  const { mentorUserId } = use(params)
  return (
    <PageGuard>
      <AdminMentorWalletDetailView mentorUserId={mentorUserId} />
    </PageGuard>
  )
}

