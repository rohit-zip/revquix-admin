"use client"

import PageGuard from "@/components/page-guard"
import MentorCouponManagement from "@/features/professional-mentor/mentor-coupon-management"

/**
 * Mentor and platform coupons. Not a legacy surface — `payment.coupon_code` is shared, and V2
 * orders redeem from it through `applicable_contexts`.
 */
export default function Page() {
  return (
    <PageGuard>
      <MentorCouponManagement />
    </PageGuard>
  )
}
