"use client"

import PageGuard from "@/components/page-guard"
import AdminToolRubricView from "@/features/tools-admin/admin-tool-rubric-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolRubricView />
    </PageGuard>
  )
}
