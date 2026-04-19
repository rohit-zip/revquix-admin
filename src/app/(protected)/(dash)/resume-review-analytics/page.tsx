"use client"

import PageGuard from "@/components/page-guard"
import AdminResumeReviewAnalyticsView from "@/features/resume-review/admin-resume-review-analytics-view"

export default function ResumeReviewAnalyticsPage() {
  return (
    <PageGuard>
      <AdminResumeReviewAnalyticsView />
    </PageGuard>
  )
}

