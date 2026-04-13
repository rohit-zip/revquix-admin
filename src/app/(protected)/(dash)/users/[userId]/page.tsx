"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import AdminUserDetailView from "@/features/admin/admin-user-detail-view"

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  return (
    <PageGuard>
      <AdminUserDetailView userId={userId} />
    </PageGuard>
  )
}

