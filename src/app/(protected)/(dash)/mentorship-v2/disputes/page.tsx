"use client"

import PageGuard from "@/components/page-guard"
import AdminDisputeVerificationView from "@/features/mentorship-v2/admin-dispute-verification-view"

/**
 * Professional Mentor V2 · Phase 7 — the dispute console and verification panel.
 *
 * Its own route, matching the one-route-per-domain precedent Phases 0-4 and 6 set. Disputes are a
 * genuinely new domain rather than an extension of the call lifecycle, so they do not fold into
 * `/mentorship-v2/calls` the way Phase 5's feedback panels did.
 *
 * Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`. Every write on this page — assign, reply, ask a
 * side, run the sweep, and above all resolve — additionally needs `PERM_MANAGE_MENTORSHIP_DISPUTES`
 * (V190), enforced server-side. A reviewer holding only the read permission sees the whole console
 * and gets a clean 403 on the action buttons, which is better than hiding controls whose absence
 * would be confusing.
 */
export default function MentorshipV2DisputesPage() {
  return (
    <PageGuard>
      <AdminDisputeVerificationView />
    </PageGuard>
  )
}
