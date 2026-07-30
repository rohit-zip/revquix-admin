"use client"

import PageGuard from "@/components/page-guard"
import AdminMentorshipV2ConsoleHomeView from "@/features/mentorship-v2/admin-mentorship-v2-console-home-view"

/**
 * Professional Mentor V2 — the console index at `/mentorship-v2`.
 *
 * Reads need `PERM_VIEW_MENTORSHIP_V2_INTERNALS`, the same permission as every console it links to,
 * so this page can never advertise a surface the viewer would be refused. It performs no writes.
 */
export default function MentorshipV2HomePage() {
  return (
    <PageGuard>
      <AdminMentorshipV2ConsoleHomeView />
    </PageGuard>
  )
}
