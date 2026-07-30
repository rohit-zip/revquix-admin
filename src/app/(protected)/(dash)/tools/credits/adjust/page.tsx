"use client"

import PageGuard from "@/components/page-guard"
import AdminToolAdjustView from "@/features/tools-admin/admin-tool-adjust-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolAdjustView />
    </PageGuard>
  )
}
