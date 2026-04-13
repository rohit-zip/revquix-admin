"use client"

import PageGuard from "@/components/page-guard"
import MentorBookingsView from "@/features/business-mentor/mentor-bookings-view"

export default function BusinessMentorBookingsPage() {
  return (
    <PageGuard>
      <MentorBookingsView />
    </PageGuard>
  )
}

