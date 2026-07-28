"use client"

import PageGuard from "@/components/page-guard"
import AdminCutoverVerificationView from "@/features/mentorship-v2/admin-cutover-verification-view"

/**
 * Professional Mentor V2 · Phase 11 verification.
 *
 * Reads on this page need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`. The write actions — running or rolling back
 * the backfill, and archiving the legacy tables — additionally need `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`,
 * enforced server-side, and are gated a second time by `app.mentorship.cutover.backfill-endpoint-enabled`.
 *
 * A read-only holder sees the page and gets a clean 403 on the action buttons. That is deliberate and
 * matches every prior phase's panel: this is the screen someone opens to answer "why can we not cut over
 * yet", and gating the diagnosis on the permission to act would hide it from the person diagnosing.
 */
export default function MentorshipV2CutoverPage() {
  return (
    <PageGuard>
      <AdminCutoverVerificationView />
    </PageGuard>
  )
}
