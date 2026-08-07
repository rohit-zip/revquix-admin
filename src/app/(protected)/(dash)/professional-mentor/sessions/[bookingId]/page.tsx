"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import SessionDetailView from "@/features/professional-mentor/console/session-detail-view"

/**
 * One session: timeline, meeting-link provenance, join evidence, feedback state, notification
 * log, and the two admin overrides for a booking the lifecycle sweep cannot move on its own.
 */
export default function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  return (
    <PageGuard>
      <SessionDetailView bookingId={bookingId} />
    </PageGuard>
  )
}
