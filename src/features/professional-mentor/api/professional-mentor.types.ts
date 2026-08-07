/**
 * ─── PROFESSIONAL MENTOR TYPES ────────────────────────────────────────────────
 *
 * TypeScript interfaces mirroring backend DTOs for
 * Professional Mentor, Slots, Coupons, and Payouts.
 */

import type { SpringPageResponse } from "@/features/admin/api/admin-access.types"

export type { SpringPageResponse }

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DISCOUNT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FLAT_INR: "FLAT_INR",
  FLAT_USD: "FLAT_USD",
} as const
export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE]

export const PAYOUT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ON_HOLD: "ON_HOLD",
} as const
export type PayoutStatus = (typeof PAYOUT_STATUS)[keyof typeof PAYOUT_STATUS]

/**
 * Derived, mentor-facing payout state (payments-plan Part 9).
 *
 * `PAYOUT_STATUS` above is what finance has done with a row; this is what the person waiting for
 * the money should understand about it. A payout row is created at payment capture — often weeks
 * before the session — so `PENDING` alone cannot distinguish "session is next Tuesday" from
 * "finished a month ago and is genuinely waiting on us".
 */
export const PAYOUT_STAGE = {
  AWAITING_SESSION: "AWAITING_SESSION",
  IN_PROGRESS: "IN_PROGRESS",
  IN_DISPUTE_WINDOW: "IN_DISPUTE_WINDOW",
  READY_TO_PROCESS: "READY_TO_PROCESS",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  ON_HOLD: "ON_HOLD",
  FAILED: "FAILED",
} as const
export type PayoutStage = (typeof PAYOUT_STAGE)[keyof typeof PAYOUT_STAGE]

export const CURRENCY_CODE = { INR: "INR", USD: "USD" } as const
export type CurrencyCode = (typeof CURRENCY_CODE)[keyof typeof CURRENCY_CODE]

export const MEETING_PROVIDER = { GOOGLE_MEET: "GOOGLE_MEET", MANUAL_GOOGLE_MEET: "MANUAL_GOOGLE_MEET" } as const
export type MeetingProvider = (typeof MEETING_PROVIDER)[keyof typeof MEETING_PROVIDER]

// ─── Category / Skill ─────────────────────────────────────────────────────────

export interface CategoryDto {
  categoryId: string
  name: string
  description: string | null
}

export interface SkillDto {
  skillId: string
  name: string
  categoryId: string
}

// ─── Mentor Profile ───────────────────────────────────────────────────────────

export interface MentorProfileResponse {
  mentorProfileId: string
  userId: string
  userName: string
  userEmail: string
  avatarUrl: string | null
  headline: string
  bio: string
  linkedinUrl: string
  portfolioUrl: string | null
  yearsOfExperience: number
  currentCompany: string | null
  currentRole: string | null
  priceInrPaise: number | null
  priceUsdCents: number | null
  hourlySessionPriceInrPaise: number | null
  hourlySessionPriceUsdCents: number | null
  averageRating: number
  totalSessions: number
  totalMockInterviews: number
  totalHourlySessions: number
  totalReviews: number
  // Analytics fields
  avgFeedbackTurnaroundHours: number | null
  totalDisputesRaised: number
  totalNoShowMentor: number
  totalNoShowUser: number
  totalMentorCancellations: number
  totalUserCancellations: number
  totalLateCancellations: number
  lateCancellationRate: number
  completionRate: number
  repeatBookingRate: number
  slotUtilizationRate: number
  totalSlotsOpened: number
  totalSlotsBooked: number
  totalMockRevenuePaise: number
  totalHourlyRevenuePaise: number
  totalRevenuePaise: number
  isActive: boolean
  isAcceptingBookings: boolean
  /** Whether the mentor has individually enabled mock interview bookings. */
  isAcceptingMockInterviews: boolean
  /** Whether the mentor has individually enabled hourly session bookings. */
  isAcceptingHourlySessions: boolean
  /** True when at least one of the two services is enabled; used as a filterable flag. */
  hasAnyServiceEnabled: boolean
  categories: CategoryDto[]
  skills: SkillDto[]
  resumeUrl: string | null
  createdAt: string
}

export interface UpdateMentorProfileRequest {
  headline?: string
  bio?: string
  linkedinUrl?: string
  portfolioUrl?: string
  currentCompany?: string
  currentRole?: string
  yearsOfExperience?: number
  categoryIds?: string[]
  skillIds?: string[]
}

export interface UpdatePricingRequest {
  priceInrPaise: number
  priceUsdCents: number
}

/**
 * Request body for admin-level per-service flag overrides.
 * Sent to PUT /professional-mentor/admin/{mentorProfileId}/service-flags
 */
export interface AdminUpdateServiceFlagsRequest {
  isAcceptingMockInterviews: boolean
  isAcceptingHourlySessions: boolean
}

// ─── Public Mentor Card ───────────────────────────────────────────────────────
/**
 * Compact mentor card as returned by POST /api/v1/public/mentors/search.
 * Admin browse views use this type after Phase C migration.
 * Note: `name` is the display name (maps to UserAuth.fullName), not `userName`.
 */
export interface PublicMentorCard {
  mentorProfileId: string
  userId: string
  username: string
  name: string | null
  avatarUrl: string | null
  headline: string | null
  location: string | null
  currentCompany: string | null
  currentRole: string | null
  yearsOfExperience: number | null
  skills: SkillDto[]
  categories: CategoryDto[]
  priceInrPaise: number | null
  priceUsdCents: number | null
  hourlySessionPriceInrPaise: number | null
  hourlySessionPriceUsdCents: number | null
  averageRating: number | null
  totalSessions: number | null
  totalReviews: number | null
  isAcceptingBookings: boolean | null
  isAcceptingMockInterviews: boolean | null
  isAcceptingHourlySessions: boolean | null
  /** ISO-8601 instant; null if mentor has no upcoming open slots. */
  nextAvailableSlot: string | null
}

export type ProfessionalSessionType = "MOCK_INTERVIEW" | "HOURLY_SESSION"

export interface MentorRatingResponse {
  ratingId: string
  mentorProfileId: string
  mentorName: string
  sessionId: string
  sessionType: ProfessionalSessionType
  userName: string
  userEmail: string
  rating: number
  comment: string
  submittedAt: string
  createdAt: string
}

// ─── Professional Mentor Slots ────────────────────────────────────────────────

/**
 * Slot availability + live pricing preview.
 *
 * Price fields are resolved live from the mentor's profile at request time — never stored
 * on the slot itself. A slot is a shared, service-agnostic availability record, so both
 * price pairs are always returned; pick the pair relevant to the booking flow you're in
 * (mock interview vs. hourly session). Either pair may be null if the mentor hasn't
 * configured pricing for that service.
 */
export interface ProfessionalSlotResponse {
  slotId: string
  mentorUserId: string
  slotStartUtc: string
  mentorTimezone: string
  durationMinutes: number
  isBooked: boolean
  isCancelled: boolean
  mockInterviewPriceInrPaise: number | null
  mockInterviewPriceUsdCents: number | null
  hourlySessionPriceInrPaise: number | null
  hourlySessionPriceUsdCents: number | null
  createdAt: string
}

export interface OpenSlotsRequest {
  startDate: string
  endDate?: string
  startTime: string
  endTime: string
  timezone: string
}

export interface BulkCancelSlotsRequest {
  from: string
  to: string
}

export interface SlotStatsResponse {
  totalOpened: number
  totalBooked: number
  totalAvailable: number
  totalCancelled: number
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export interface CouponResponse {
  couponId: string
  code: string
  mentorUserId: string
  discountType: DiscountType
  discountValue: number
  maxDiscountInrPaise: number | null
  maxDiscountUsdCents: number | null
  minOrderInrPaise: number | null
  minOrderUsdCents: number | null
  maxTotalRedemptions: number | null
  maxRedemptionsPerUser: number
  totalRedemptions: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableContexts: string
  isMentorSpecific: boolean
  createdAt: string
}

export interface CreateCouponRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscountInrPaise?: number
  maxDiscountUsdCents?: number
  minOrderInrPaise?: number
  minOrderUsdCents?: number
  maxTotalRedemptions?: number
  maxRedemptionsPerUser?: number
  validFrom: string
  validUntil: string
  applicableContexts?: string[]
  isMentorSpecific?: boolean
  /** Optional list of email addresses this coupon is restricted to. */
  targetedEmails?: string[]
}

export interface CouponValidationResponse {
  couponCode: string
  discountType: string
  discountValue: number
  maxDiscountDisplay: string | null
  minOrderDisplay: string | null
  originalAmountDisplay: string
  discountAmountDisplay: string
  finalAmountDisplay: string
  currency: string
  discountAmountMinor: number
  finalAmountMinor: number
  isValid: boolean
  message: string
}

export interface ApplyCouponRequest {
  couponCode: string
  amountMinor: number
  currency: string
  mentorProfileId: string
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export interface MentorPayoutResponse {
  payoutId: string
  mentorUserId: string
  mentorName: string | null
  mentorEmail: string | null
  paymentOrderId: string
  grossAmountMinor: number | null
  platformFeeMinor: number | null
  gstAmountMinor: number | null
  payoutAmountMinor: number
  currency: CurrencyCode
  commissionPercentage: number
  status: PayoutStatus
  payoutReference: string | null
  paidAt: string | null
  adminNote: string | null
  createdAt: string
  updatedAt: string
  // Phase 5: Override & Review Fields
  /** Non-null when admin has set an override amount; used on completion. */
  adminOverrideAmountMinor: number | null
  /** Human-readable justification for the override. */
  adminOverrideReason: string | null
  /** True when this payout requires explicit admin acknowledgement before processing. */
  requiresReview: boolean
  /** True if at least one refund was issued against the linked payment order. */
  refundIssued: boolean
  /** Cumulative refunded amount in minor units. Null if no refund has been issued. */
  refundAmountMinor: number | null

  // ── Derived stage (payments-plan Part 9) ───────────────────────────────────
  /**
   * The mentor-facing state, derived server-side from the booking + dispute window + refund state.
   * Distinct from `status`, which stays the finance processing lifecycle this console drives.
   */
  payoutStage: PayoutStage | null
  /** Server-written explanation of `payoutStage`. */
  stageReason: string | null
  /** When the buyer's dispute window closes. Null when none applies. */
  disputeWindowEndsAt: string | null
  /** Whole days until `disputeWindowEndsAt`, rounded up. */
  daysUntilProcessable: number | null
  /**
   * Whether this may be processed now — true only in `READY_TO_PROCESS`.
   *
   * **Gate bulk-processing on this.** Until Part 9 nothing stopped a payout being processed while
   * the buyer's dispute window was open, so a dispute upheld afterwards found the money already gone.
   */
  processable: boolean | null
  /**
   * Whether the mentor has a VERIFIED payout account — i.e. whether there is anywhere to send it.
   *
   * Distinct from `processable`, which answers "has the dispute window closed and did the session
   * happen". A payout can be perfectly processable and still unpayable, and that combination was
   * invisible: the queue showed an amount and a green stage with no bank account behind it.
   * `bulkProcessPayouts` refuses these server-side; this is so an operator sees why before clicking.
   */
  payoutAccountVerified: boolean | null
  /** The V2 commerce order behind this payout. Null for legacy V1 payouts. */
  commerceOrderId: string | null
  /** Service title for V2 payouts. */
  sessionServiceTitle: string | null

  // ── Session reference (V1: from the linked PaymentOrder; V2: from service_booking) ──
  /** What kind of session this payout is for — "MOCK_INTERVIEW" or "HOURLY_SESSION". Null if not a session payout. */
  sessionContext: string | null
  /** The bookingId of the underlying session. */
  sessionBookingId: string | null
  /** Student's display name for the session. */
  sessionUserName: string | null
  /** Mentor's display name for the session. */
  sessionMentorName: string | null
  /** UTC start time of the booked slot. */
  sessionSlotStartUtc: string | null
  /** Session duration in minutes. */
  sessionDurationMinutes: number | null
  /**
   * Current lifecycle status of the underlying booking, e.g. "CONFIRMED", "COMPLETED",
   * "CANCELLED_BY_MENTOR". This is the *session* status — distinct from the payout `status`.
   */
  sessionStatus: string | null
}

// ── Phase 2 — Payout Stats ───────────────────────────────────────────────────

export interface PayoutStatsResponse {
  totalCount: number
  pendingCount: number
  processingCount: number
  completedCount: number
  failedCount: number
  onHoldCount: number
  pendingAmountMinor: number
  processingAmountMinor: number
  completedAmountMinor: number
  failedAmountMinor: number
  onHoldAmountMinor: number
  /** Sum of pending + processing + onHold amounts (total outstanding obligation). */
  pendingObligationMinor: number
}

// ── Phase 2 — Audit Log ──────────────────────────────────────────────────────

export type PayoutAction =
  | "PROCESS_INITIATED"
  | "COMPLETED"
  | "HELD_BY_ADMIN"
  | "RELEASED_BY_ADMIN"
  | "AUTO_FAILED"
  | "BULK_PROCESSED"
  | "HELD_FOR_FEEDBACK"
  | "RELEASED_AFTER_FEEDBACK"
  | "AMOUNT_OVERRIDDEN"

export interface PayoutAuditLogEntry {
  auditLogId: string
  payoutId: string
  action: PayoutAction
  previousStatus: PayoutStatus | null
  newStatus: PayoutStatus
  performedByUserId: string | null
  note: string | null
  createdAt: string
}

// ── Phase 5 — Payout Override ────────────────────────────────────────────────

export interface OverridePayoutAmountRequest {
  overrideAmountMinor: number
  reason: string
}

// ── Phase 2 — Bulk Process ───────────────────────────────────────────────────

export interface BulkProcessPayoutsResponse {
  total: number
  processed: number
  skipped: number
  /** Skipped specifically because the buyer's dispute window is still open. */
  skippedInDisputeWindow: number
  /** Processed via an explicit dispute-window override. */
  overridden: number
  /** One entry per skipped payout — an admin who selected 40 and processed 31 needs to know which. */
  skippedDetails: Array<{ payoutId: string; stage: string | null; reason: string }>
}

// ── Phase 8 — Reports & Export ──────────────────────────────────────────────

export interface MonthlyPayoutSummaryRow {
  /**
   * Currency of every minor-unit amount on this row. // currency on MonthlyPayoutSummaryRow
   *
   * Rows are grouped by currency server-side rather than summed across it, so a month with payouts
   * in two currencies produces two rows. Never total rows with different currencies.
   */
  currency: string

  year: number
  month: number
  completedCount: number
  totalPayoutMinor: number
  totalGrossMinor: number
  totalPlatformFeeMinor: number
  totalGstMinor: number
}

export interface CommissionRevenueRow {
  /**
   * Currency of every minor-unit amount on this row. // currency on CommissionRevenueRow
   *
   * Rows are grouped by currency server-side rather than summed across it, so a month with payouts
   * in two currencies produces two rows. Never total rows with different currencies.
   */
  currency: string

  year: number
  month: number
  transactionCount: number
  platformFeeMinor: number
  gstMinor: number
  totalRevenueMinor: number
}

export interface MentorEarningsBreakdownRow {
  /**
   * Currency of every minor-unit amount on this row. // currency on MentorEarningsBreakdownRow
   *
   * Rows are grouped by currency server-side rather than summed across it, so a month with payouts
   * in two currencies produces two rows. Never total rows with different currencies.
   */
  currency: string

  mentorUserId: string
  mentorName: string
  mentorEmail: string
  completedPayouts: number
  totalPayoutMinor: number
  totalGrossMinor: number
  totalPlatformFeeMinor: number
}

export interface PayoutReportDateRange {
  from?: string
  to?: string
}

