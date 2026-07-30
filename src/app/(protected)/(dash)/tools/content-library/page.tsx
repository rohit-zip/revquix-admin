"use client"

import PageGuard from "@/components/page-guard"
import AdminToolContentView from "@/features/tools-admin/admin-tool-content-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolContentView />
    </PageGuard>
  )
}
