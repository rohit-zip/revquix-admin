"use client"

import PageGuard from "@/components/page-guard"
import AdminToolFraudView from "@/features/tools-admin/admin-tool-fraud-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolFraudView />
    </PageGuard>
  )
}
