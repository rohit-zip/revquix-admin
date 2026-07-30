"use client"

import PageGuard from "@/components/page-guard"
import AdminToolCreditsView from "@/features/tools-admin/admin-tool-credits-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolCreditsView />
    </PageGuard>
  )
}
