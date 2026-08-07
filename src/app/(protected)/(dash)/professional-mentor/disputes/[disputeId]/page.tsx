"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import DisputeDetailView from "@/features/professional-mentor/console/dispute-detail-view"

/**
 * One dispute: the case file, the thread including internal notes, the audit trail, and the
 * resolution form.
 *
 * This is the target of every admin dispute-alert email. `DisputeAdminMailService.consoleUrl()`
 * builds `/professional-mentor/disputes/{disputeId}` — the old `?disputeId=` query form still
 * resolves via the redirect at `/mentorship-v2/[...path]`, because alerts already sent cannot be
 * rewritten.
 */
export default function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = use(params)
  return (
    <PageGuard>
      <DisputeDetailView disputeId={disputeId} />
    </PageGuard>
  )
}
