"use client"

import PageGuard from "@/components/page-guard"
import AdminMentorApplicationsReview from "@/features/mentor-application/admin-application-review"

export default function MentorApplicationsPage() {
  return (
    <PageGuard>
      <AdminMentorApplicationsReview />
    </PageGuard>
  )
}

