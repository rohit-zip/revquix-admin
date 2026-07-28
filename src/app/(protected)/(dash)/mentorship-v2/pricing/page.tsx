"use client"

import PageGuard from "@/components/page-guard"
import AdminPricingVerificationView from "@/features/mentorship-v2/admin-pricing-verification-view"

/**
 * Professional Mentor V2 · Phase 8 — the currency and country-pricing console.
 *
 * Its own route, matching the one-route-per-domain precedent every prior phase set. Reads need
 * `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; every write on this page additionally needs Phase 3's
 * `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side. **No new permission was added for this
 * phase** — retuning a multiplier or remapping a country is a commerce-configuration action of exactly
 * the kind that permission exists for, unlike Phase 7's dispute resolution, which is a discretionary
 * judgement between two named parties.
 *
 * A reviewer holding only the read permission sees the whole console and gets a clean 403 on the action
 * buttons, which is better than hiding controls whose absence would be confusing.
 */
export default function MentorshipV2PricingPage() {
  return (
    <PageGuard>
      <AdminPricingVerificationView />
    </PageGuard>
  )
}
