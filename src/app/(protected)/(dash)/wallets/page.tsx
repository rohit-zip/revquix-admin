"use client"

import PageGuard from "@/components/page-guard"
import AdminMentorWalletsView from "@/features/payment/admin-mentor-wallets-view"

export default function WalletsPage() {
  return (
    <PageGuard>
      <AdminMentorWalletsView />
    </PageGuard>
  )
}

