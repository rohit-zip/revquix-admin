"use client"

import PageGuard from "@/components/page-guard"
import AdminToolSpendView from "@/features/tools-admin/admin-tool-spend-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolSpendView />
    </PageGuard>
  )
}
