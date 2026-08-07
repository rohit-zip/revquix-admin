"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminMentorWalletDetailView from "@/features/payment/admin-mentor-wallet-detail-view"

/**
 * One mentor's wallet: balance, ledger, and the payout accounts a transfer would actually go to.
 *
 * A route rather than a tab because it is deep, and because the payouts queue links into it per
 * mentor.
 */
export default function Page({ params }: { params: Promise<{ mentorUserId: string }> }) {
  const { mentorUserId } = use(params)
  return (
    <PageGuard>
      <AdminMentorWalletDetailView mentorUserId={mentorUserId} />
    </PageGuard>
  )
}
