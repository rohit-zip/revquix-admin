"use client"

import PageGuard from "@/components/page-guard"
import AdminCallVerificationView from "@/features/mentorship-v2/admin-call-verification-view"

/**
 * Professional Mentor V2 · Phase 4 verification.
 *
 * One route per phase, matching Phase 0–3 — the Phase 11 cleanup then becomes a file
 * deletion rather than a careful edit of a combined page.
 *
 * Reads on this page need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; running the sweep,
 * force-completing a booking, and moderating a review additionally need
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side. A non-admin holding only the
 * read permission sees the page and gets a clean 403 on a write action, which is correct —
 * better than hiding controls whose absence would be confusing.
 */
export default function MentorshipV2CallsPage() {
  return (
    <PageGuard>
      <AdminCallVerificationView />
    </PageGuard>
  )
}
