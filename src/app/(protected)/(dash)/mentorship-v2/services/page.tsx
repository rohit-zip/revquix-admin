"use client"

import PageGuard from "@/components/page-guard"
import AdminServiceCatalogVerificationView from "@/features/mentorship-v2/admin-service-catalog-verification-view"

/**
 * Professional Mentor V2 · Phase 2 verification.
 *
 * One route per phase, matching the Phase 0 and Phase 1 panels — the Phase 11 cleanup then
 * becomes a file deletion rather than a careful edit of a combined page.
 */
export default function MentorshipV2ServiceCatalogPage() {
  return (
    <PageGuard>
      <AdminServiceCatalogVerificationView />
    </PageGuard>
  )
}
