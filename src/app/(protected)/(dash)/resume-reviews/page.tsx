"use client"

import PageGuard from "@/components/page-guard"
import AdminResumeReviewsView from "@/features/resume-review/admin-resume-reviews-view"

export default function ResumeReviewsPage() {
  return (
    <PageGuard>
      <AdminResumeReviewsView />
    </PageGuard>
  )
}

