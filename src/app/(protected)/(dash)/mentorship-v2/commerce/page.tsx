"use client"

import PageGuard from "@/components/page-guard"
import AdminCommerceVerificationView from "@/features/mentorship-v2/admin-commerce-verification-view"

/**
 * Professional Mentor V2 · Phase 3 verification.
 *
 * One route per phase, matching the Phase 0–2 panels — the Phase 11 cleanup then becomes a
 * file deletion rather than a careful edit of a combined page.
 *
 * Reads on this page need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; the two sweep buttons and the
 * refund form additionally need `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side.
 * A non-admin holding only the read permission sees the page and gets a clean 403 if they
 * press a write button — which is the correct outcome, and better than hiding controls whose
 * absence would be confusing.
 */
export default function MentorshipV2CommercePage() {
  return (
    <PageGuard>
      <AdminCommerceVerificationView />
    </PageGuard>
  )
}
