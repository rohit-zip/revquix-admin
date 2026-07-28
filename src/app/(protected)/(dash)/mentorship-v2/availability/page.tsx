"use client"

import PageGuard from "@/components/page-guard"
import AdminAvailabilityVerificationView from "@/features/mentorship-v2/admin-availability-verification-view"

/**
 * Professional Mentor V2 · Phase 1 verification.
 *
 * Kept as its own route rather than a tab on the Phase 0 page: the two answer
 * different questions (seeded reference data + pricing vs a live per-mentor
 * computation), and one route per phase makes the Phase 11 cleanup a deletion.
 */
export default function MentorshipV2AvailabilityPage() {
  return (
    <PageGuard>
      <AdminAvailabilityVerificationView />
    </PageGuard>
  )
}
