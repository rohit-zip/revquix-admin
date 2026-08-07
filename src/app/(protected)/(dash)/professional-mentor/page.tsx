"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorOverviewView from "@/features/professional-mentor/console/overview-view"

/**
 * The section index: what needs doing, and where the money is.
 *
 * Replaces the old V2 console home, which was a directory of eleven consoles — a page that
 * existed because nothing else answered "what needs doing", and a directory is not that answer.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorOverviewView />
    </PageGuard>
  )
}
