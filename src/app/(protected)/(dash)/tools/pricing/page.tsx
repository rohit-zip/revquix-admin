"use client"

import PageGuard from "@/components/page-guard"
import AdminToolPricingView from "@/features/tools-admin/admin-tool-pricing-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminToolPricingView />
    </PageGuard>
  )
}
