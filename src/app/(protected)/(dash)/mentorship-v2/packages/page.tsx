"use client"

import PageGuard from "@/components/page-guard"
import AdminPackageVerificationView from "@/features/mentorship-v2/admin-package-verification-view"

/**
 * Professional Mentor V2 · Phase 6 verification.
 *
 * One route per feature domain, matching Phases 0-3/4's own precedent (Phase 5 extended
 * Phase 4's existing `/mentorship-v2/calls` route in place rather than adding a new one,
 * because it was an extension of the same call-lifecycle domain; packages are a genuinely
 * new domain, so they get their own route here).
 *
 * Reads on this page need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`; running the lifecycle sweep
 * additionally needs `PERM_MANAGE_MENTORSHIP_V2_COMMERCE`, enforced server-side. A non-admin
 * holding only the read permission sees the page and gets a clean 403 on the sweep button,
 * which is correct — better than hiding a control whose absence would be confusing.
 */
export default function MentorshipV2PackagesPage() {
  return (
    <PageGuard>
      <AdminPackageVerificationView />
    </PageGuard>
  )
}
