"use client"

import PageGuard from "@/components/page-guard"
import AdminToolAuditView from "@/features/tools-admin/admin-tool-audit-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolAuditView />
    </PageGuard>
  )
}
