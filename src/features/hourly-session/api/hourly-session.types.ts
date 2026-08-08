/**
 * ⚠️ PROFESSIONAL MENTOR V1 — RETIRED SURFACE
 *
 * Part of the legacy (V1) mentorship stack that Professional Mentor V2 replaced. Nothing
 * advertises it: no sidebar entry, no command-palette row, no avatar-menu item, and every public
 * "Book session" CTA resolves to the mentor's V2 storefront instead.
 *
 * It stays mounted deliberately. `app.mentorship.cutover.stage` is still `DUAL_RUN`, legacy
 * bookings that already exist have to stay readable, and notification mail already delivered
 * carries deep links straight into these pages. `LegacyV1Notice` renders on each one to name its
 * V2 successor.
 *
 * Deletion is gated on `legacy.archive_readiness()` reading zero blocking rows, the cutover stage
 * reaching `DECOMMISSIONED`, and the 90-day `archive-retention-days` window.
 *
 * @deprecated Superseded by Professional Mentor V2. Do not add features here.
 */

/**
 * ─── HOURLY SESSION TYPES (Admin) ────────────────────────────────────────────
 *
 * Type definitions for admin hourly session management.
 */

export type {
  MockInterviewBookingStatus,
} from "@/features/mock-interview/api/mock-interview.types"

export {
  MOCK_INTERVIEW_BOOKING_STATUS,
  BOOKING_STATUS_OPTIONS,
} from "@/features/mock-interview/api/mock-interview.types"

import type { MockInterviewBookingStatus } from "@/features/mock-interview/api/mock-interview.types"

export interface HourlySessionBookingResponse {
  bookingId: string
  intakeId: string
  userId: string
  userName: string
  mentorUserId: string
  mentorName: string
  mentorProfileId: string
  mentorHeadline?: string
  mentorCompany?: string
  mentorRole?: string
  status: MockInterviewBookingStatus
  currency: string
  originalAmountMinor: number
  discountAmountMinor: number
  finalAmountMinor: number
  couponCode?: string
  paymentOrderId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  paymentStatus?: string
  razorpayRefundId?: string
  refundAmountMinor?: number
  refundedAt?: string
  cancellationReason?: string
  cancelledAt?: string
  slotStartUtc: string
  durationMinutes: number
  meetingUrl?: string
  sessionId?: string
  meetingProvider?: string
  meetingUrlPending?: boolean
  allowedJoinAt?: string
  createdAt: string
  userAttendanceResponse?: boolean | null
  mentorAttendanceResponse?: boolean | null
  topic?: string
  description?: string
  additionalNotes?: string
  feedbackSubmitted?: boolean
  hasExistingDispute?: boolean
}

export interface HourlySessionFeedbackResponse {
  feedbackId: string
  bookingId: string
  mentorName: string
  mentorUserId: string
  userName: string
  userUserId: string
  overallRating: number
  summary: string
  mentorNotesHtml?: string
  quickTags?: string[]
  submittedAt: string
  updatedAt: string
}

