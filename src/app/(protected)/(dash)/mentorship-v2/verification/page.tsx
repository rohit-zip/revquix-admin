"use client"

import PageGuard from "@/components/page-guard"
import AdminMentorshipV2VerificationView from "@/features/mentorship-v2/admin-mentorship-v2-verification-view"

export default function MentorshipV2VerificationPage() {
  return (
    <PageGuard>
      <AdminMentorshipV2VerificationView />
    </PageGuard>
  )
}
