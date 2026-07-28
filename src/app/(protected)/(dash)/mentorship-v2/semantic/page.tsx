"use client"

import PageGuard from "@/components/page-guard"
import AdminSemanticVerificationView from "@/features/mentorship-v2/admin-semantic-verification-view"

/**
 * Professional Mentor V2 · Phase 10 — the hybrid semantic search console.
 *
 * Its own route, matching the one-route-per-domain precedent every prior phase set. Reads need
 * `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; the write actions — re-probing for pgvector, running an embedding pass,
 * clearing the index, running the offline jobs, accepting or rejecting a skill suggestion — additionally need
 * Phase 3's `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side.
 *
 * **No new permission was added for Phase 10.** Almost everything here is index maintenance, which is
 * reconstructible from the source of truth and moves no money. The one action that changes something a mentor
 * owns is accepting a skill-tag suggestion, and that is a catalogue edit of exactly the kind that permission
 * already covers — not a discretionary judgement between two named parties, which is what earned Phase 7 its
 * own permission.
 *
 * Note what is deliberately not on this page: any way to switch semantic ranking on for real visitors, or to
 * set the experiment rollout. Those go through configuration and a deploy, because the phase's exit criterion
 * is a product decision that may legitimately come back as "keep V1" — and a decision of that weight should
 * leave a trace in version control rather than in an audit log nobody reads.
 */
export default function MentorshipV2SemanticPage() {
  return (
    <PageGuard>
      <AdminSemanticVerificationView />
    </PageGuard>
  )
}
