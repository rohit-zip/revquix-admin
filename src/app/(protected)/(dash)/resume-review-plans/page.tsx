"use client"

import PageGuard from "@/components/page-guard"
import AdminResumeReviewPlansView from "@/features/resume-review/admin-resume-review-plans-view"

export default function ResumeReviewPlansPage() {
  return (
    <PageGuard>
      <AdminResumeReviewPlansView />
    </PageGuard>
  )
}

