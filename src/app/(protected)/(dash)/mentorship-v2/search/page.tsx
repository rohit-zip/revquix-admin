"use client"

import PageGuard from "@/components/page-guard"
import AdminSearchVerificationView from "@/features/mentorship-v2/admin-search-verification-view"

/**
 * Professional Mentor V2 · Phase 9 — the marketplace and search console.
 *
 * Its own route, matching the one-route-per-domain precedent every prior phase set. Reads need
 * `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; the write actions on this page — running the projection sweep,
 * rebuilding the index, curating synonyms — additionally need Phase 3's
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side.
 *
 * **No new permission was added for Phase 9.** Everything here is index maintenance and merchandising
 * configuration: it rebuilds derived data, it does not move money and it does not change a mentor's
 * standing. That places it on the same side of the line as forcing a reconciliation sweep, which is
 * exactly what that permission already covers — unlike Phase 7's dispute resolution, which is a
 * discretionary judgement between two named parties and did warrant its own.
 *
 * A reviewer holding only the read permission sees the whole console and gets a clean 403 from the action
 * buttons, which is better than hiding controls whose absence would be confusing.
 */
export default function MentorshipV2SearchPage() {
  return (
    <PageGuard>
      <AdminSearchVerificationView />
    </PageGuard>
  )
}
