"use client"

import PageGuard from "@/components/page-guard"
import AdminToolRunsView from "@/features/tools-admin/admin-tool-runs-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolRunsView />
    </PageGuard>
  )
}
