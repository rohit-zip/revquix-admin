"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorSessionsView from "@/features/professional-mentor/console/sessions-view"

/**
 * Every V2 booking, in a table. There was no such surface before — only a capped "next 24
 * hours" sample inside the call snapshot and an inspect-by-id endpoint.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorSessionsView />
    </PageGuard>
  )
}
