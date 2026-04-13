"use client"

import PageGuard from "@/components/page-guard"
import AdminMentorReportsView from "@/features/professional-mentor/admin-mentor-reports-view"

export default function MentorReportsPage() {
  return (
    <PageGuard>
      <AdminMentorReportsView />
    </PageGuard>
  )
}

