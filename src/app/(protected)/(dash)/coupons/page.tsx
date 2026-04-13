"use client"

import PageGuard from "@/components/page-guard"
import MentorCouponManagement from "@/features/professional-mentor/mentor-coupon-management"

export default function CouponsPage() {
  return (
    <PageGuard>
      <MentorCouponManagement />
    </PageGuard>
  )
}

