"use client"

import PageGuard from "@/components/page-guard"
import AllBookingsView from "@/features/business-mentor/all-bookings-view"

export default function BusinessMentorAllBookingsPage() {
  return (
    <PageGuard>
      <AllBookingsView />
    </PageGuard>
  )
}

