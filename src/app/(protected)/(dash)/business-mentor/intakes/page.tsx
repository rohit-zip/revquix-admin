"use client"

import PageGuard from "@/components/page-guard"
import IntakeManagementView from "@/features/business-mentor/intake-management-view"

export default function BusinessMentorIntakesPage() {
  return (
    <PageGuard>
      <IntakeManagementView />
    </PageGuard>
  )
}

