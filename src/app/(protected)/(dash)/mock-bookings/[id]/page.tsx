"use client"

import { use } from "react"
import PageGuard from "@/components/page-guard"
import BookingDetailView from "@/features/mock-interview/booking-detail-view"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"

export default function MockBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <PageGuard>
      <BookingDetailView
        bookingId={id}
        backPath={PATH_CONSTANTS.ADMIN_MOCK_BOOKINGS}
        backLabel="All Mock Bookings"
      />
    </PageGuard>
  )
}

