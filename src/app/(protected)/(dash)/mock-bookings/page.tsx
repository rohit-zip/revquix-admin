"use client"

import PageGuard from "@/components/page-guard"
import AdminMockBookingsView from "@/features/mock-interview/admin-mock-bookings-view"

export default function MockBookingsPage() {
  return (
    <PageGuard>
      <AdminMockBookingsView />
    </PageGuard>
  )
}

