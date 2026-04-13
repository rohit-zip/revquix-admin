"use client"

import PageGuard from "@/components/page-guard"
import MentorSlotsView from "@/features/business-mentor/mentor-slots-view"

export default function BusinessMentorSlotsPage() {
  return (
    <PageGuard>
      <MentorSlotsView />
    </PageGuard>
  )
}

