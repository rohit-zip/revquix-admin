"use client"

import PageGuard from "@/components/page-guard"
import ProfessionalMentorServicesView from "@/features/professional-mentor/console/services-view"

/**
 * The service catalogue, with the marketplace-indexed column that turns "why is my service not
 * showing up" from an investigation into a glance.
 */
export default function Page() {
  return (
    <PageGuard>
      <ProfessionalMentorServicesView />
    </PageGuard>
  )
}
