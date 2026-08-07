"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorDisputesView from "@/features/professional-mentor/console/disputes-view"

/**
 * The dispute table, plus the read-only feedback SLA breach list beneath it.
 *
 * Reads need PERM_VIEW_MENTORSHIP_V2_INTERNALS; resolving needs
 * PERM_MANAGE_MENTORSHIP_DISPUTES, enforced server-side. A reviewer holding only the read
 * permission sees the whole page and gets a clean 403 on the actions, which is better than
 * hiding controls whose absence would be confusing.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorDisputesView />
    </PageGuard>
  )
}
