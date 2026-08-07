"use client"

import PageGuard from "@/components/page-guard"
import AdminReferralReviewView from "@/features/tools-admin/admin-referral-review-view"

export default function Page() {
  return (
    <PageGuard>
      <AdminReferralReviewView />
    </PageGuard>
  )
}
